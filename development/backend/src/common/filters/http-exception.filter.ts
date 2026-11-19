import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = res.message || exception.message;
        code = res.code || (status === 400 ? 'VALIDATION_ERROR' : exception.name);
        details = res.details || res.errors || undefined;
      }
    } else if (typeof exception === 'object' && exception !== null) {
      const err = exception as any;
      if (err.code === 'NO_COVERAGE') {
        status = 422;
        code = 'NO_COVERAGE';
        message = err.message;
        details = [{ field: 'zip', message: 'ZIP code is outside the 5 supported NY regions' }];
      } else if (err.code === 'STORE_NOT_ELIGIBLE') {
        status = 422;
        code = 'STORE_NOT_ELIGIBLE';
        message = err.message;
        details = [{ dispensaryId: err.dispensaryId, productId: err.productId, message: err.message }];
      } else if (err.code === 'CART_EXPIRED' || err.name === 'CartExpiredError') {
        status = 410;
        code = 'CART_EXPIRED';
        message = err.message;
      } else if (err.code === 'PREVIEW_STALE' || err.name === 'PreviewStaleError') {
        status = 409;
        code = 'PREVIEW_STALE';
        message = err.message;
      } else if (err.code === 'UNFULFILLABLE_ITEMS' || err.name === 'UnfulfillableItemsError') {
        status = 422;
        code = 'UNFULFILLABLE_ITEMS';
        message = err.message;
        details = err.unfulfillable;
      } else if (err.code === 'NOT_FOUND' || err.name === 'OrderNotFoundError') {
        status = 404;
        code = 'NOT_FOUND';
        message = err.message;
      } else if (err.code === 'FORBIDDEN' || err.name === 'ForbiddenOrderAccessError') {
        status = 403;
        code = 'FORBIDDEN';
        message = err.message;
      } else {
        message = err.message || message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

