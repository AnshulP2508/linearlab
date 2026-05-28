import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateDeveloperPocDto } from './dto/update-developer-poc.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeveloperWorkspaceService } from './developer-workspace.service';

type AuthedRequest = Request & { user: AuthUser };

@Controller('developer-workspace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DEVELOPER)
export class DeveloperWorkspaceController {
  constructor(
    private readonly developerWorkspaceService: DeveloperWorkspaceService,
  ) {}

  @Get('me')
  getMe(@Req() req: AuthedRequest) {
    return this.developerWorkspaceService.getMe(req.user);
  }

  @Get('pocs')
  getAssignedPocs(
    @Req() req: AuthedRequest,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('deadline') deadline?: string,
    @Query('search') search?: string,
  ) {
    return this.developerWorkspaceService.getAssignedPocs(req.user, {
      status,
      priority,
      deadline,
      search,
    });
  }

  @Get('pocs/:id')
  getPocDetail(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.developerWorkspaceService.getPocDetail(req.user, id);
  }

  @Patch('pocs/:id')
  updatePoc(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: UpdateDeveloperPocDto,
  ) {
    return this.developerWorkspaceService.updatePoc(req.user, id, body);
  }

  @Get('feedback')
  getFeedback(
    @Req() req: AuthedRequest,
    @Query('type') type?: string,
    @Query('pocId') pocId?: string,
  ) {
    return this.developerWorkspaceService.getFeedback(req.user, { type, pocId });
  }

  @Patch('profile')
  updateProfile(
    @Req() req: AuthedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.developerWorkspaceService.updateProfile(req.user, body);
  }

  @Post('change-password')
  changePassword(
    @Req() req: AuthedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    return this.developerWorkspaceService.changePassword(req.user, body);
  }
}
