import { Controller, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StrainType } from '@prisma/client';
import { z } from 'zod';
import { listProducts, getProductBySlug, resolveProduct } from '../../server/products';

const listQuerySchema = z.object({
  category: z.string().min(1).max(100).optional(),
  strainType: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.nativeEnum(StrainType).optional()
  ),
  minThc: z.coerce.number().min(0).max(100).optional(),
  maxThc: z.coerce.number().min(0).max(100).optional(),
  brand: z.string().min(1).max(100).optional(),
  q: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const resolveQuerySchema = z
  .object({
    productId: z.string().optional(),
    terrificProductId: z.string().optional(),
    externalId: z.string().optional(),
    sku: z.string().optional(),
  })
  .refine(
    (data) => !!(data.productId || data.terrificProductId || data.externalId || data.sku),
    {
      message: 'At least one identifier (productId, terrificProductId, externalId, or sku) must be provided',
    }
  );

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'List cannabis products with filtering and pagination' })
  async listProducts(@Query() query: Record<string, string>) {
    const parseResult = listQuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw new HttpException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product filter parameters',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await listProducts(parseResult.data);
    return {
      data: result,
      message: 'Products retrieved successfully',
    };
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve a product by productId, terrificProductId, externalId, or sku' })
  async resolve(@Query() query: Record<string, string>) {
    const parseResult = resolveQuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw new HttpException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid resolve query parameters',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const product = await resolveProduct(parseResult.data);
    if (!product) {
      throw new HttpException(
        {
          code: 'UNMAPPED_PRODUCT',
          message: 'Identifier not mapped to an active Owtlet cannabis product',
          details: [{ query: parseResult.data }],
        },
        HttpStatus.NOT_FOUND
      );
    }

    return {
      data: product,
      message: 'Product resolved successfully',
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product detail by slug with dispensary inventory and coverage' })
  async getBySlug(@Param('slug') slug: string, @Query('zip') zip?: string) {
    if (!slug || slug.trim().length === 0) {
      throw new HttpException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Product slug is required',
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const product = await getProductBySlug(slug, { zip });
    if (!product) {
      throw new HttpException(
        {
          code: 'NOT_FOUND',
          message: `Product with slug "${slug}" not found`,
        },
        HttpStatus.NOT_FOUND
      );
    }

    return {
      data: product,
      message: 'Product detail retrieved successfully',
    };
  }
}
