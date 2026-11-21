import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminGuard, PublicAdmin } from '../../common/guards/admin.guard';
import {
  adminLogin,
  getAdminFromToken,
  AdminAuthError,
} from '../../server/admin/auth-service';
import {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  AdminProductError,
} from '../../server/admin/products-service';
import {
  listAdminInventory,
  bulkUpdateAdminInventory,
  AdminInventoryError,
} from '../../server/admin/inventory-service';
import {
  listAdminDispensaries,
  getAdminDispensaryById,
  createAdminDispensary,
  updateAdminDispensary,
  getAdminDispensaryPlatform,
  updateAdminDispensaryPlatform,
  AdminDispensaryError,
} from '../../server/admin/dispensaries-service';
import {
  listAdminMappings,
  upsertSingleMapping,
  importMappingsFromCsv,
  AdminMappingError,
} from '../../server/admin/mappings-service';
import { syncWooProducts } from '../../server/admin/woocommerce-sync-service';
import { runVendorHealthCheck } from '../../server/admin/vendor-health-service';
import {
  listAdminBrands,
  getAdminBrandById,
  createAdminBrand,
  updateAdminBrand,
  assignBrandDispensaries,
  AdminBrandError,
} from '../../server/admin/brands-service';
import {
  listAdminOrders,
  updateSubOrderStatus,
  AdminOrderError,
} from '../../server/admin/orders-service';
import {
  listAdminShows,
  createAdminShow,
  updateAdminShow,
  pinProductToShow,
  unpinProductFromShow,
  startShow,
  endShow,
  AdminShowError,
} from '../../server/admin/shows-service';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
  verifyAdminToken,
} from '../../server/admin/crypto';
import { SubOrderStatus } from '@prisma/client';

function getAdminCookieToken(req: Request): string | undefined {
  return req.cookies?.[ADMIN_COOKIE_NAME] || (req.headers['x-admin-token'] as string) || undefined;
}

@ApiTags('Admin Console')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  // Auth
  @PublicAdmin()
  @Post('login')
  @ApiOperation({ summary: 'Admin login (argon2id + owt_admin session)' })
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const { email, password } = body || {};
      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Email and password required' },
          timestamp: new Date().toISOString(),
        });
      }
      const { user, token } = await adminLogin(email, password);
      res.cookie(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { user },
        message: 'Admin logged in successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminAuthError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @PublicAdmin()
  @Post('logout')
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@Res() res: Response) {
    res.clearCookie(ADMIN_COOKIE_NAME);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: { loggedOut: true },
      message: 'Admin logged out successfully',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current admin profile' })
  async me(@Req() req: Request, @Res() res: Response) {
    try {
      const token = getAdminCookieToken(req);
      const user = await getAdminFromToken(token);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { user },
        message: 'Admin session verified',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminAuthError ? err.status : 401;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'UNAUTHORIZED', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Products
  @Get('products')
  @ApiOperation({ summary: 'List products' })
  async getProducts(
    @Query('search') search?: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActiveStr?: string,
    @Res() res?: Response
  ) {
    try {
      const isActive = isActiveStr !== undefined ? isActiveStr === 'true' : undefined;
      const items = await listAdminProducts({ search, brandId, categoryId, isActive });
      return res!.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Products fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res!.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() body: any, @Res() res: Response) {
    try {
      const product = await createAdminProduct(body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: product,
        message: 'Product created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminProductError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string, @Res() res: Response) {
    try {
      const product = await getAdminProductById(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: product,
        message: 'Product fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminProductError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const updated = await updateAdminProduct(id, body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: updated,
        message: 'Product updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminProductError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await deleteAdminProduct(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Product deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminProductError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Inventory
  @Get('inventory')
  async getInventory(
    @Query('dispensaryId') dispensaryId?: string,
    @Query('productId') productId?: string,
    @Res() res?: Response
  ) {
    try {
      const items = await listAdminInventory({ dispensaryId, productId });
      return res!.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Inventory fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res!.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Put('inventory')
  async updateInventory(@Body() body: any, @Res() res: Response) {
    try {
      const items = body.items || body;
      const result = await bulkUpdateAdminInventory(items);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Inventory updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminInventoryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Dispensaries
  @Get('dispensaries')
  async getDispensaries(@Res() res: Response) {
    try {
      const items = await listAdminDispensaries();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Dispensaries fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('dispensaries')
  async createDispensary(@Body() body: any, @Res() res: Response) {
    try {
      const dispensary = await createAdminDispensary(body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: dispensary,
        message: 'Dispensary created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminDispensaryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('dispensaries/:id')
  async getDispensary(@Param('id') id: string, @Res() res: Response) {
    try {
      const dispensary = await getAdminDispensaryById(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: dispensary,
        message: 'Dispensary fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminDispensaryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Patch('dispensaries/:id')
  async updateDispensary(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const updated = await updateAdminDispensary(id, body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: updated,
        message: 'Dispensary updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminDispensaryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('dispensaries/:id/platform')
  @ApiOperation({ summary: 'Get dispensary platform and redirection settings' })
  async getDispensaryPlatform(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await getAdminDispensaryPlatform(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data,
        message: 'Dispensary platform configuration fetched',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminDispensaryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Put('dispensaries/:id/platform')
  @ApiOperation({ summary: 'Set dispensary platform, cartBaseUrl, allowedHosts, notes' })
  async updateDispensaryPlatform(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const data = await updateAdminDispensaryPlatform(id, body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data,
        message: 'Dispensary platform updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminDispensaryError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Vendor Product Mappings
  @Get('mappings')
  @ApiOperation({ summary: 'List vendor product mappings with optional dispensary filter' })
  async getMappings(
    @Query('dispensaryId') dispensaryId: string,
    @Query('search') search: string,
    @Res() res: Response
  ) {
    try {
      const items = await listAdminMappings({ dispensaryId, search });
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Mappings fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminMappingError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Put('mappings')
  @ApiOperation({ summary: 'Upsert single vendor product mapping' })
  async upsertMapping(@Body() body: any, @Res() res: Response) {
    try {
      const mapping = await upsertSingleMapping(body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: mapping,
        message: 'Mapping updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminMappingError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('mappings/import')
  @ApiOperation({ summary: 'Import vendor product mappings from CSV' })
  async importMappings(@Body() body: any, @Res() res: Response) {
    try {
      const csvContent = typeof body === 'string' ? body : body.csv || body.content || '';
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: { code: 'INVALID_CSV', message: 'CSV content is required as string or body.csv' },
          timestamp: new Date().toISOString(),
        });
      }

      const report = await importMappingsFromCsv(csvContent);
      const isCompleteSuccess = report.failed === 0;

      return res.status(isCompleteSuccess ? HttpStatus.OK : HttpStatus.BAD_REQUEST).json({
        success: isCompleteSuccess,
        data: report,
        message: isCompleteSuccess
          ? `CSV imported: ${report.created} created, ${report.updated} updated`
          : `CSV import failed with ${report.failed} error(s). No rows were written.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'IMPORT_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Brands
  @Get('brands')
  async getBrands(@Res() res: Response) {
    try {
      const items = await listAdminBrands();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Brands fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('brands')
  async createBrand(@Body() body: any, @Res() res: Response) {
    try {
      const brand = await createAdminBrand(body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: brand,
        message: 'Brand created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminBrandError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('brands/:id')
  async getBrand(@Param('id') id: string, @Res() res: Response) {
    try {
      const brand = await getAdminBrandById(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: brand,
        message: 'Brand fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminBrandError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Patch('brands/:id')
  async updateBrand(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const updated = await updateAdminBrand(id, body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: updated,
        message: 'Brand updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminBrandError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Put('brands/:id/dispensaries')
  async assignBrandDispensaries(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const dispensaryIds = body.dispensaryIds || [];
      const updated = await assignBrandDispensaries(id, dispensaryIds);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: updated,
        message: 'Brand partner dispensaries assigned successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminBrandError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Orders
  @Get('orders')
  async getOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Res() res?: Response
  ) {
    try {
      const items = await listAdminOrders({ status, search });
      return res!.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Orders fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res!.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Patch('sub-orders/:id')
  async updateSubOrderStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const { status, note } = body || {};
      if (!status || !Object.values(SubOrderStatus).includes(status)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Valid SubOrderStatus required' },
          timestamp: new Date().toISOString(),
        });
      }
      const result = await updateSubOrderStatus(id, status, note);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Sub-order status updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminOrderError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Live shows
  @Get('live-shows')
  async getLiveShows(@Res() res: Response) {
    try {
      const items = await listAdminShows();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { items, total: items.length },
        message: 'Live shows fetched successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('live-shows')
  async createLiveShow(@Body() body: any, @Res() res: Response) {
    try {
      const show = await createAdminShow(body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: show,
        message: 'Live show created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Patch('live-shows/:id')
  async updateLiveShow(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const updated = await updateAdminShow(id, body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: updated,
        message: 'Live show updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('live-shows/:id/products')
  async pinProduct(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const { productId, sortOrder } = body || {};
      if (!productId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'productId is required' },
          timestamp: new Date().toISOString(),
        });
      }
      const pinned = await pinProductToShow(id, productId, sortOrder ?? 0);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: pinned,
        message: 'Product pinned to show successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Delete('live-shows/:id/products/:productId')
  async unpinProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Res() res: Response
  ) {
    try {
      const result = await unpinProductFromShow(id, productId);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Product unpinned from show successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('live-shows/:id/start')
  async startLiveShow(@Param('id') id: string, @Res() res: Response) {
    try {
      const show = await startShow(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: show,
        message: 'Live show started successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('live-shows/:id/end')
  async endLiveShow(@Param('id') id: string, @Res() res: Response) {
    try {
      const show = await endShow(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: show,
        message: 'Live show ended successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err instanceof AdminShowError ? err.status : 500;
      return res.status(status).json({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // WooCommerce Product Sync
  @Post('sync/woocommerce')
  @ApiOperation({ summary: 'Synchronize products from WooCommerce API' })
  async syncWooCommerce(@Body() body: any, @Res() res: Response) {
    try {
      const dryRun = Boolean(body?.dryRun);
      const report = await syncWooProducts({ dryRun });
      return res.status(HttpStatus.OK).json({
        success: true,
        data: report,
        message: `WooCommerce sync completed ${dryRun ? '(DRY RUN)' : ''}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'WOO_SYNC_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Vendor Health Check
  @Post('health-check/run')
  @ApiOperation({ summary: 'Run vendor health check across all active dispensaries' })
  async runHealthCheck(@Res() res: Response) {
    try {
      const report = await runVendorHealthCheck();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: report,
        message: 'Vendor health check completed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: 'HEALTH_CHECK_ERROR', message: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

