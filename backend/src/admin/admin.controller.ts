import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AdminService } from './admin.service';

type AuthedRequest = Request & { user: AuthUser };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getDashboard(@Query() query: QueryDashboardDto) {
    return this.adminService.getDashboard(query);
  }

  @Get('analytics')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('notifications')
  getNotifications() {
    return this.adminService.getNotifications();
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    return this.adminService.markNotificationRead(id);
  }

  @Get('activity-logs')
  getActivityLogs() {
    return this.adminService.getActivityLogs();
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingsDto, @Req() req: AuthedRequest) {
    return this.adminService.updateSettings(dto, req.user);
  }
}
