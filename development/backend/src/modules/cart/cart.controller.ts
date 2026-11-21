import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  getOrCreateCart,
  getCartBySessionToken,
  clearCart,
  syncCartItems,
  getCartVendors,
  setCartVendor,
  getCartVendorWarnings,
  CartExpiredError,
  UnmappedProductException,
} from '../../server/cart';
import { CART_COOKIE_NAME, CART_COOKIE_OPTIONS } from '../../server/cart/session';
import { cartSyncSchema, CartSyncAction } from '../../server/cart/types';
import { SHOPPER_COOKIE_NAME, verifyShopperToken } from '../../server/shopper-account/crypto';

function getSessionToken(req: Request): string | null {
  return (
    req.cookies?.[CART_COOKIE_NAME] ||
    (req.headers['x-cart-token'] as string) ||
    null
  );
}

function setCookie(res: Response, token: string) {
  res.cookie(CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  @Get()
  @ApiOperation({ summary: 'Get current cart from cookie session' })
  async getCart(@Req() req: Request, @Res() res: Response) {
    const sessionToken = getSessionToken(req);

    if (sessionToken) {
      const { cart, isExpired } = await getCartBySessionToken(sessionToken);

      if (isExpired) {
        const fresh = await getOrCreateCart(null);
        setCookie(res, fresh.sessionToken);
        return res.status(HttpStatus.GONE).json({
          success: false,
          statusCode: HttpStatus.GONE,
          error: {
            code: 'CART_EXPIRED',
            message: 'Your cannabis cart hold has expired. A fresh cart has been issued.',
            details: [{ newCartId: fresh.cart.id, expiresAt: fresh.cart.expiresAt }],
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (cart) {
        return res.status(HttpStatus.OK).json({
          success: true,
          statusCode: HttpStatus.OK,
          data: cart,
          message: 'Cart retrieved',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const { cart, sessionToken: newToken } = await getOrCreateCart(null);
    setCookie(res, newToken);
    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      data: cart,
      message: 'Cart initialized',
      timestamp: new Date().toISOString(),
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clear(@Req() req: Request, @Res() res: Response) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      const fresh = await getOrCreateCart(null);
      setCookie(res, fresh.sessionToken);
      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: fresh.cart,
        message: 'Cart initialized (was empty)',
        timestamp: new Date().toISOString(),
      });
    }

    const updatedCart = await clearCart(sessionToken);
    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      data: updatedCart,
      message: 'Cart cleared successfully',
      timestamp: new Date().toISOString(),
    });
  }

  @Post('items')
  @ApiOperation({ summary: 'Add or sync items to cart' })
  async addItem(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    return this.handleSync(body, req, res, 'addProductToCart');
  }

  @Patch('items')
  @ApiOperation({ summary: 'Update cart items quantity or preferred store' })
  async updateItem(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    return this.handleSync(body, req, res, 'updateProductInCart');
  }

  @Delete('items')
  @ApiOperation({ summary: 'Remove items from cart' })
  async removeItem(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    return this.handleSync(body, req, res, 'removeProductFromCart');
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get active dispensaries sorted by distance with cart mapping stats' })
  async getVendors(
    @Query('zip') zip: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('lng') lng: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    let sessionToken = getSessionToken(req);
    if (!sessionToken) {
      const fresh = await getOrCreateCart(null);
      sessionToken = fresh.sessionToken;
      setCookie(res, sessionToken);
    }

    let shopperId: string | null = null;
    const rawShopperCookie = req.cookies?.[SHOPPER_COOKIE_NAME];
    if (rawShopperCookie) {
      const verification = await verifyShopperToken(rawShopperCookie);
      if (verification.valid && verification.shopperId) {
        shopperId = verification.shopperId;
      }
    }

    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;

    const data = await getCartVendors(sessionToken, {
      zip: zip || null,
      lat: isNaN(latNum as any) ? null : latNum,
      lng: isNaN(lngNum as any) ? null : lngNum,
      shopperId,
    });

    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  @Put('vendor')
  @ApiOperation({ summary: 'Set selected dispensary for cart' })
  async setVendor(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    let sessionToken = getSessionToken(req);
    if (!sessionToken) {
      const fresh = await getOrCreateCart(null);
      sessionToken = fresh.sessionToken;
      setCookie(res, sessionToken);
    }

    const dispensaryId = body?.dispensaryId;
    if (!dispensaryId || typeof dispensaryId !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: { code: 'VALIDATION_ERROR', message: 'dispensaryId is required' },
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const updatedCart = await setCartVendor(sessionToken, dispensaryId);
      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: updatedCart,
        message: 'Cart dispensary updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: { code: 'DISPENSARY_NOT_FOUND', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('warnings')
  @ApiOperation({ summary: 'Get unmapped or unavailable cart items for selected vendor' })
  async getWarnings(
    @Query('dispensaryId') dispensaryId: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: [],
        timestamp: new Date().toISOString(),
      });
    }

    const warnings = await getCartVendorWarnings(sessionToken, dispensaryId || null);
    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      data: warnings,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleSync(
    body: any,
    req: Request,
    res: Response,
    defaultAction?: CartSyncAction
  ) {
    if (!body || typeof body !== 'object') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        timestamp: new Date().toISOString(),
      });
    }

    if (!body.action && defaultAction) {
      body.action = defaultAction;
    }

    const parsed = cartSyncSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cart payload parameters',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    let sessionToken = getSessionToken(req);
    let isNewSession = false;

    if (!sessionToken) {
      const fresh = await getOrCreateCart(null);
      sessionToken = fresh.sessionToken;
      isNewSession = true;
    }

    try {
      const updatedCart = await syncCartItems(sessionToken, parsed.data);
      if (isNewSession) {
        setCookie(res, sessionToken);
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: updatedCart,
        message: 'Cart items updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof CartExpiredError || err.name === 'CartExpiredError') {
        return res.status(HttpStatus.GONE).json({
          success: false,
          statusCode: HttpStatus.GONE,
          error: {
            code: 'CART_EXPIRED',
            message: err.message || 'Cart has expired. Please refresh your cart.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof UnmappedProductException || err.code === 'UNMAPPED_PRODUCT') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: {
            code: 'UNMAPPED_PRODUCT',
            message: err.message,
            details: err.details,
          },
          timestamp: new Date().toISOString(),
        });
      }

      throw err;
    }
  }
}

