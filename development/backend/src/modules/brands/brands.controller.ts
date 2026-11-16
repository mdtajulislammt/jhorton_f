import { Controller, Get, Param } from '@nestjs/common';
import { listActiveBrands, getBrandStorefront, BrandNotFoundError } from '../../server/brands';

@Controller('brands')
export class BrandsController {
  @Get()
  async getBrands() {
    const items = await listActiveBrands();
    return {
      success: true,
      data: { items },
      message: 'Active brands retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':slug')
  async getBrandStorefront(@Param('slug') slug: string) {
    try {
      const storefront = await getBrandStorefront(slug);
      return {
        success: true,
        data: storefront,
        message: 'Brand storefront retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof BrandNotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        };
      }
      throw error;
    }
  }
}

