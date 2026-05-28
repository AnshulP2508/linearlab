import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

@Controller()
export class DashboardController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/dashboard')
  getAdminDashboard() {
    return { message: 'Admin dashboard data' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @Get('developer/dashboard')
  getDeveloperDashboard() {
    return { message: 'Developer dashboard data' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('user/dashboard')
  getUserDashboard() {
    return { message: 'User dashboard data' };
  }
}
