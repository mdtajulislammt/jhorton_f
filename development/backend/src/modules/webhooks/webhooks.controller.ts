import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  storeConfirmationSchema,
  processStoreConfirmationWebhook,
  confirmSubOrder,
  verifySignedConfirmationToken,
  InvalidSignatureError,
  SubOrderNotFoundError,
  ForbiddenWebhookAccessError,
  ConfirmationConflictError,
} from '../../server/orders/confirm';
import { prisma } from '../../server/db';

@ApiTags('Dispensary Webhooks')
@Controller('webhooks')
export class WebhooksController {
  @Post('store-confirmation')
  @ApiOperation({
    summary: 'Partner dispensary order confirmation webhook (HMAC-SHA256 signature)',
  })
  async storeConfirmationWebhook(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const rawBody =
      (req as any).rawBody?.toString('utf8') ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(body));

    const parseResult = storeConfirmationSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid confirmation payload',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const signature =
      (req.headers['x-owtlet-signature'] as string) ||
      (req.headers['X-Owtlet-Signature'] as string) ||
      null;
    const timestamp =
      (req.headers['x-owtlet-timestamp'] as string) ||
      (req.headers['X-Owtlet-Timestamp'] as string) ||
      null;
    const dispensary =
      (req.headers['x-owtlet-dispensary'] as string) ||
      (req.headers['X-Owtlet-Dispensary'] as string) ||
      null;

    try {
      const result = await processStoreConfirmationWebhook({
        rawBody,
        headers: {
          signature,
          timestamp,
          dispensary,
        },
        payload: parseResult.data,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Store confirmation recorded',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof InvalidSignatureError || err.code === 'INVALID_SIGNATURE') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          error: {
            code: 'INVALID_SIGNATURE',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof SubOrderNotFoundError || err.code === 'NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          error: {
            code: 'NOT_FOUND',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof ForbiddenWebhookAccessError || err.code === 'FORBIDDEN') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err instanceof ConfirmationConflictError || err.code === 'CONFIRMATION_CONFLICT') {
        return res.status(HttpStatus.CONFLICT).json({
          success: false,
          statusCode: HttpStatus.CONFLICT,
          error: {
            code: 'CONFIRMATION_CONFLICT',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: {
          code: 'SERVER_ERROR',
          message: err?.message || 'Failed to process store confirmation',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('store-confirmation')
  @ApiOperation({
    summary: 'Signed link dispensary order confirmation (token-based)',
  })
  async storeConfirmationSignedLink(
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!token) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing confirmation token. Pass ?token=<signed-token>',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid confirmation token structure',
        },
        timestamp: new Date().toISOString(),
      });
    }

    let tokenData: any;
    try {
      tokenData = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid token encoding',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!tokenData?.subOrderId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Token missing subOrderId',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: tokenData.subOrderId },
      include: { dispensary: true },
    });

    if (!subOrder) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: {
          code: 'NOT_FOUND',
          message: 'SubOrder not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const verified = verifySignedConfirmationToken(token, subOrder.dispensary.webhookSecret);
    if (!verified.valid || !verified.payload) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        error: {
          code: 'INVALID_SIGNATURE',
          message: verified.error || 'Invalid or expired confirmation token',
        },
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = await confirmSubOrder({
        subOrderId: verified.payload.subOrderId,
        status: verified.payload.status,
        confirmationRef: verified.payload.confirmationRef,
        confirmationUrl: verified.payload.confirmationUrl,
        expectedDispensaryId: subOrder.dispensaryId,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Store confirmation recorded',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof ConfirmationConflictError) {
        return res.status(HttpStatus.CONFLICT).json({
          success: false,
          statusCode: HttpStatus.CONFLICT,
          error: {
            code: 'CONFIRMATION_CONFLICT',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: {
          code: 'SERVER_ERROR',
          message: err?.message || 'Failed to process confirmation',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

