import { Module } from '@nestjs/common';
import { DispensariesController } from './dispensaries.controller';

@Module({
  controllers: [DispensariesController],
})
export class DispensariesModule {}

