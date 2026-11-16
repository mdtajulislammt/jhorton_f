import { Module } from '@nestjs/common';
import { LiveShowsController } from './live-shows.controller';

@Module({
  controllers: [LiveShowsController],
})
export class LiveShowsModule {}

