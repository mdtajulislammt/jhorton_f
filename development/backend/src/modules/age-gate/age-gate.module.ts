import { Module } from '@nestjs/common';
import { AgeGateController } from './age-gate.controller';

@Module({
  controllers: [AgeGateController],
})
export class AgeGateModule {}

