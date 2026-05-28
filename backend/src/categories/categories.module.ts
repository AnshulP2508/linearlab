import { Module } from '@nestjs/common';
import { AdminAuditService } from '../common/admin-audit.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, AdminAuditService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
