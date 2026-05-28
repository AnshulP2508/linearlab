import { Module } from '@nestjs/common';
import { UserPortalController } from './user-portal.controller';
import { UserPortalService } from './user-portal.service';

@Module({
  controllers: [UserPortalController],
  providers: [UserPortalService],
})
export class UserPortalModule {}
