import { Controller, Post, Get, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  signAgeToken,
  verifyAgeToken,
  recordAgeVerificationSession,
  AGE_COOKIE_NAME,
  AGE_COOKIE_OPTIONS,
} from '../../server/age-session';

@ApiTags('Age Gate')
@Controller('age-verify')
export class AgeGateController {
  @Post()
  @ApiOperation({ summary: 'Verify 21+ age attestation' })
  async verifyAge(
    @Body() body: { confirmed21Plus?: boolean },
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (typeof body.confirmed21Plus !== 'boolean') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid payload. confirmed21Plus boolean is required.',
          details: [{ field: 'confirmed21Plus', message: 'Must be a boolean' }],
        },
        timestamp: new Date().toISOString(),
      });
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    if (!body.confirmed21Plus) {
      const { nonce, expiresAt } = await signAgeToken(undefined, 24 * 60 * 60 * 1000);
      await recordAgeVerificationSession({
        nonce,
        confirmed: false,
        ip,
        userAgent,
        expiresAt,
      });

      res.clearCookie(AGE_COOKIE_NAME);
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        error: {
          code: 'FORBIDDEN',
          message: 'You must be 21 or older to enter Owtlet.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { token, nonce, expiresAt } = await signAgeToken();
    await recordAgeVerificationSession({
      nonce,
      confirmed: true,
      ip,
      userAgent,
      expiresAt,
    });

    res.cookie(AGE_COOKIE_NAME, token, {
      ...AGE_COOKIE_OPTIONS,
      expires: expiresAt,
    });

    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      data: {
        verified: true,
        expiresAt: expiresAt.toISOString(),
      },
      message: 'Age verified',
      timestamp: new Date().toISOString(),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Check active age verification status' })
  async checkStatus(@Req() req: Request) {
    const token = req.cookies?.[AGE_COOKIE_NAME];
    const result = await verifyAgeToken(token);

    if (result.valid && result.expiresAt) {
      return {
        verified: true,
        expiresAt: result.expiresAt.toISOString(),
      };
    }

    return {
      verified: false,
      reason: result.reason || 'MISSING',
    };
  }
}

