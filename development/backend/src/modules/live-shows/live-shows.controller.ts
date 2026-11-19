import { Controller, Get, Param, Query } from '@nestjs/common';
import { listLiveShows, getLiveShowById } from '../../server/live-shows';
import { ShowStatus, VideoFormat } from '@prisma/client';

@Controller('live-shows')
export class LiveShowsController {
  @Get()
  async getLiveShows(
    @Query('status') status?: ShowStatus,
    @Query('format') format?: VideoFormat,
    @Query('brand') brand?: string
  ) {
    const items = await listLiveShows({ status, format, brand });
    return {
      success: true,
      data: { items },
      message: 'Live shows retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async getLiveShow(@Param('id') id: string) {
    const show = await getLiveShowById(id);
    if (!show) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Live show not found: ${id}`,
        },
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: show,
      message: 'Live show retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

