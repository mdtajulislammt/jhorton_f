import { Controller, Get, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';
import { findEligible, NoCoverageError } from '../../server/dispensaries';

const querySchema = z
  .object({
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'ZIP must be a 5-digit number')
      .optional(),
    fulfillment: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
    brand: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.fulfillment === 'DELIVERY' && !data.zip) {
        return false;
      }
      return true;
    },
    {
      message: 'ZIP code is required for DELIVERY fulfillment',
      path: ['zip'],
    }
  );

@ApiTags('Dispensaries')
@Controller('dispensaries')
export class DispensariesController {
  @Get()
  @ApiOperation({ summary: 'Find eligible licensed partner dispensaries by fulfillment and ZIP' })
  async getDispensaries(@Query() query: Record<string, string>) {
    const parseResult = querySchema.safeParse(query);
    if (!parseResult.success) {
      throw new HttpException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const { zip, fulfillment, brand } = parseResult.data;

    try {
      const result = await findEligible({
        zip,
        fulfillmentType: fulfillment,
        brandSlug: brand,
      });

      return {
        data: {
          zip: zip ?? null,
          fulfillmentType: fulfillment,
          brand: brand ?? null,
          region: result.region,
          count: result.items.length,
          dispensaries: result.items,
        },
        message: 'Eligible dispensaries retrieved successfully',
      };
    } catch (err: any) {
      if (err instanceof NoCoverageError || err.code === 'NO_COVERAGE') {
        throw new HttpException(
          {
            code: 'NO_COVERAGE',
            message: err.message,
            details: [{ field: 'zip', message: 'ZIP code is outside the 5 supported NY regions' }],
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw err;
    }
  }
}
