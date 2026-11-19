import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  registerShopper,
  loginShopper,
  getShopperProfile,
  updateShopperProfile,
  listShopperAddresses,
  createShopperAddress,
  updateShopperAddress,
  deleteShopperAddress,
  requestPasswordReset,
  confirmPasswordReset,
  getShopperOrders,
  verifyShopperToken,
  SHOPPER_COOKIE_NAME,
  SHOPPER_COOKIE_OPTIONS,
  registerShopperSchema,
  loginShopperSchema,
  updateShopperProfileSchema,
  shopperAddressSchema,
  updateShopperAddressSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
  ShopperAccountError,
} from '../../server/shopper-account';

@Controller('account')
export class AccountController {
  private async getAuthenticatedShopperId(req: Request): Promise<string> {
    const rawCookie = req.cookies?.[SHOPPER_COOKIE_NAME];
    const verification = await verifyShopperToken(rawCookie);
    if (!verification.valid || !verification.shopperId) {
      throw new ShopperAccountError('UNAUTHORIZED', 'Authentication required', 401);
    }
    return verification.shopperId;
  }

  @Post('register')
  async register(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = registerShopperSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const cartSessionToken = req.cookies?.['owt_cart'];
      const result = await registerShopper(parsed.data, cartSessionToken);
      res.cookie(SHOPPER_COOKIE_NAME, result.token, SHOPPER_COOKIE_OPTIONS);
      return {
        success: true,
        data: result,
        message: 'Account registered successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'REGISTRATION_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = loginShopperSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const cartSessionToken = req.cookies?.['owt_cart'];
      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await loginShopper(parsed.data, cartSessionToken, clientIp);
      res.cookie(SHOPPER_COOKIE_NAME, result.token, SHOPPER_COOKIE_OPTIONS);
      return {
        success: true,
        data: result,
        message: 'Logged in successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'LOGIN_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SHOPPER_COOKIE_NAME, { path: '/' });
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const profile = await getShopperProfile(shopperId);
      return {
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'UNAUTHORIZED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() body: any) {
    const parsed = updateShopperProfileSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile update input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const updated = await updateShopperProfile(shopperId, parsed.data);
      return {
        success: true,
        data: updated,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'UPDATE_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('addresses')
  async getAddresses(@Req() req: Request) {
    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const items = await listShopperAddresses(shopperId);
      return {
        success: true,
        data: { items },
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'UNAUTHORIZED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('addresses')
  async createAddress(@Req() req: Request, @Body() body: any) {
    const parsed = shopperAddressSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid address input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const address = await createShopperAddress(shopperId, parsed.data);
      return {
        success: true,
        data: address,
        message: 'Address added successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'CREATE_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Patch('addresses/:id')
  async updateAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const parsed = updateShopperAddressSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid address update input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const updated = await updateShopperAddress(shopperId, id, parsed.data);
      return {
        success: true,
        data: updated,
        message: 'Address updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'UPDATE_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Delete('addresses/:id')
  async deleteAddress(@Req() req: Request, @Param('id') id: string) {
    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      await deleteShopperAddress(shopperId, id);
      return {
        success: true,
        message: 'Address deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'DELETE_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Req() req: Request, @Body() body: any) {
    const parsed = requestPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await requestPasswordReset(parsed.data, baseUrl, clientIp);
      return {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'REQUEST_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(@Body() body: any) {
    const parsed = confirmPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reset confirmation input',
          details: parsed.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await confirmPasswordReset(parsed.data);
      return {
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'RESET_FAILED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('orders')
  async getOrders(@Req() req: Request) {
    try {
      const shopperId = await this.getAuthenticatedShopperId(req);
      const items = await getShopperOrders(shopperId);
      return {
        success: true,
        data: { items },
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || 'UNAUTHORIZED',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

