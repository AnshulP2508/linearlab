import { Module } from '@nestjs/common';
import { PocsController } from './pocs.controller';
import { PocsService } from './pocs.service';

@Module({
  controllers: [PocsController],
  providers: [PocsService],
  exports: [PocsService],
})
export class PocsModule {}
