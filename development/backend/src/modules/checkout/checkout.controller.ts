import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CART_COOKIE_NAME } from '../../server/cart/session';
import {
  checkoutHandoffSchema,
  executeCheckoutHandoff,
  ForbiddenOrderAccessError,
  OrderNotFoundError,
  ProviderConfigurationError,
  SubOrderNotFoundError,
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
  @Post('handoff')
  @ApiOperation({
    summary: 'Compliant dispensary checkout handoff (Zero ID / Zero payment, Leafly & retailer redirects)',
  })
  async handoff(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const parseResult = checkoutHandoffSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid handoff request payload',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { orderId, subOrderId } = parseResult.data;
    const sessionToken = getSessionToken(req);
    const shopperCookie = req.cookies?.['owt_shopper'] || null;

    try {
      const result = await executeCheckoutHandoff({
        orderId,
        subOrderId,
        session: {
          cartSessionToken: sessionToken,
          shopperId: shopperCookie,
        },
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: result,
        message: 'Ready for handoff',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof OrderNotFoundError || err.code === 'NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: {
            code: 'NOT_FOUND',
            message: err.message || 'Order not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof SubOrderNotFoundError || err.code === 'SUB_ORDER_NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: {
            code: 'SUB_ORDER_NOT_FOUND',
            message: err.message || 'Sub-order not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof ForbiddenOrderAccessError || err.code === 'FORBIDDEN') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          error: {
            code: 'FORBIDDEN',
            message: err.message || 'Access to order denied',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof ProviderConfigurationError) {
        return res.status(HttpStatus.BAD_GATEWAY).json({
          success: false,
          statusCode: HttpStatus.BAD_GATEWAY,
          error: {
            code: 'UPSTREAM_ERROR',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      throw err;
    }
  }
}

