import { Global, Module } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';
import { SecurityMonitorService } from './security-monitor.service';
import { UploadSecurityService } from './upload-security.service';

@Global()
@Module({
  providers: [AdminAuditService, SecurityMonitorService, UploadSecurityService],
  exports: [AdminAuditService, SecurityMonitorService, UploadSecurityService],
})
export class CommonServicesModule {}
