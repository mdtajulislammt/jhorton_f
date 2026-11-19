import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CART_COOKIE_NAME } from '../../server/cart/session';
import { CartExpiredError } from '../../server/cart';
import { NoCoverageError } from '../../server/dispensaries';
import {
  createDistributionPreview,
  StoreNotEligibleError,
} from '../../server/distribution';
import {
  createOrder,
  getOrderById,
  createOrderSchema,
  previewDistributionSchema,
  CartEmptyError,
  OrderNotFoundError,
  PreviewStaleError,
  UnfulfillableItemsError,
  ForbiddenOrderAccessError,
} from '../../server/orders';

function getSessionToken(req: Request): string | null {
  return (
    req.cookies?.[CART_COOKIE_NAME] ||
    (req.headers['x-cart-token'] as string) ||
    null
  );
}

@ApiTags('Orders & Distribution')
@Controller('orders')
export class OrdersController {
  @Post('preview')
  @ApiOperation({ summary: 'Preview multi-dispensary cart distribution, hours, distance, and preview hash' })
  async preview(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: { code: 'VALIDATION_ERROR', message: 'Cart session not found' },
        timestamp: new Date().toISOString(),
      });
    }

    const parseResult = previewDistributionSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid preview request',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { fulfillmentType, zip, preferredDispensaryId, itemOverrides } =
      parseResult.data;

    try {
      const result = await createDistributionPreview({
        cartSessionToken: sessionToken,
        fulfillmentType,
        zip,
        preferredDispensaryId,
        itemOverrides,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: result,
        message: 'Distribution preview generated',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof NoCoverageError || err.code === 'NO_COVERAGE') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          success: false,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: {
            code: 'NO_COVERAGE',
            message: err.message,
            details: [{ field: 'zip', message: 'ZIP code is outside the 5 supported NY regions' }],
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof StoreNotEligibleError || err.code === 'STORE_NOT_ELIGIBLE') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          success: false,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: {
            code: 'STORE_NOT_ELIGIBLE',
            message: err.message,
            details: [
              {
                dispensaryId: err.dispensaryId,
                productId: err.productId,
                message: err.message,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof CartExpiredError || err.name === 'CartExpiredError') {
        return res.status(HttpStatus.GONE).json({
          success: false,
          statusCode: HttpStatus.GONE,
          error: { code: 'CART_EXPIRED', message: err.message },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message === 'Cart not found') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: { code: 'NOT_FOUND', message: 'Active cart not found' },
          timestamp: new Date().toISOString(),
        });
      }

      throw err;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create parent Order and sub-orders atomically (Zero ID / Zero payment)' })
  async create(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: { code: 'VALIDATION_ERROR', message: 'Cart session not found' },
        timestamp: new Date().toISOString(),
      });
    }

    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid order creation payload',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const shopperCookie = req.cookies?.['owt_shopper'] || null;

    try {
      const result = await createOrder(parseResult.data, {
        cartSessionToken: sessionToken,
        shopperId: shopperCookie,
      });

      const statusCode = result.isExisting ? HttpStatus.OK : HttpStatus.CREATED;
      return res.status(statusCode).json({
        success: true,
        statusCode,
        data: result.order,
        message: result.isExisting ? 'Order already created for this cart' : 'Order created',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof PreviewStaleError || err.code === 'PREVIEW_STALE') {
        return res.status(HttpStatus.CONFLICT).json({
          success: false,
          statusCode: HttpStatus.CONFLICT,
          error: {
            code: 'PREVIEW_STALE',
            message:
              err.message ||
              'Stock availability or pricing has changed since preview. Please refresh preview.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof UnfulfillableItemsError || err.code === 'UNFULFILLABLE_ITEMS') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          success: false,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: {
            code: 'UNFULFILLABLE_ITEMS',
            message: 'Cart contains items that cannot be fulfilled for the selected destination',
            details: err.unfulfillable,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof CartExpiredError || err.name === 'CartExpiredError') {
        return res.status(HttpStatus.GONE).json({
          success: false,
          statusCode: HttpStatus.GONE,
          error: { code: 'CART_EXPIRED', message: err.message },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof NoCoverageError || err.code === 'NO_COVERAGE') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          success: false,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: {
            code: 'NO_COVERAGE',
            message: err.message,
            details: [{ field: 'zip', message: 'ZIP code is outside the 5 supported NY regions' }],
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof StoreNotEligibleError || err.code === 'STORE_NOT_ELIGIBLE') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          success: false,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: {
            code: 'STORE_NOT_ELIGIBLE',
            message: err.message,
            details: [
              {
                dispensaryId: err.dispensaryId,
                productId: err.productId,
                message: err.message,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof CartEmptyError || err.code === 'CART_EMPTY') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          error: { code: 'CART_EMPTY', message: err.message },
          timestamp: new Date().toISOString(),
        });
      }

      throw err;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail by ID' })
  async getOrder(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const sessionToken = getSessionToken(req);
    const shopperCookie = req.cookies?.['owt_shopper'] || null;

    try {
      const order = await getOrderById(id, {
        cartSessionToken: sessionToken,
        shopperId: shopperCookie,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: order,
        message: 'Order retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof OrderNotFoundError || err.code === 'NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: { code: 'NOT_FOUND', message: 'Order not found' },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof ForbiddenOrderAccessError || err.code === 'FORBIDDEN') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          error: { code: 'FORBIDDEN', message: 'Access to order denied' },
          timestamp: new Date().toISOString(),
        });
      }

      throw err;
    }
  }
}

