import { Module } from '@nestjs/common';
import { AdminAuditService } from '../common/admin-audit.service';
import { PocsModule } from '../pocs/pocs.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PocsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService],
})
export class AdminModule {}
