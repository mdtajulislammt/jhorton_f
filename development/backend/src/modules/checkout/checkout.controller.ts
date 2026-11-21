import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CART_COOKIE_NAME, CART_COOKIE_OPTIONS, generateCartSessionToken } from '../../server/cart/session';
import { verifyShopperToken } from '../../server/shopper-account/crypto';
import {
  generateHandoffRedirect,
  ForbiddenOrderAccessError,
  OrderNotFoundError,
  SubOrderNotFoundError,
  HandoffError,
} from '../../server/checkout-handoff';

function getSessionToken(req: Request): string | null {
  return (
    req.cookies?.[CART_COOKIE_NAME] ||
    (req.headers['x-cart-token'] as string) ||
    null
  );
}

@ApiTags('Checkout Handoff')
@Controller('checkout')
export class CheckoutController {
  @Get('handoff/redirect')
  @ApiOperation({
    summary: 'Direct 302 redirect to vendor cart with verified host and UTM tracking',
  })
  async redirect(
    @Query('orderId') orderId: string,
    @Query('subOrderId') subOrderId: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!orderId) {
      return res.redirect(HttpStatus.FOUND, '/checkout?handoffError=VALIDATION_ERROR');
    }

    const sessionToken = getSessionToken(req);
    const shopperCookie = req.cookies?.['owt_shopper'] || null;
    let verifiedShopperId: string | null = null;
    if (shopperCookie) {
      const verification = await verifyShopperToken(shopperCookie);
      if (verification.valid && verification.shopperId) {
        verifiedShopperId = verification.shopperId;
      }
    }

    try {
      const { redirectUrl } = await generateHandoffRedirect({
        orderId,
        subOrderId,
        session: {
          cartSessionToken: sessionToken,
          shopperId: verifiedShopperId,
        },
      });

      // Clear/rotate cart cookie after conversion
      const clearCart = process.env.CLEAR_CART_AFTER_HANDOFF !== 'false';
      if (clearCart) {
        const freshToken = generateCartSessionToken();
        res.cookie(CART_COOKIE_NAME, freshToken, CART_COOKIE_OPTIONS);
      }

      return res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (err: any) {
      const errorCode = err.code || (err instanceof OrderNotFoundError ? 'NOT_FOUND' : err instanceof ForbiddenOrderAccessError ? 'FORBIDDEN' : 'HANDOFF_ERROR');
      return res.redirect(HttpStatus.FOUND, `/checkout?handoffError=${encodeURIComponent(errorCode)}`);
    }
  }
}
