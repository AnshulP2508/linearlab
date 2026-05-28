import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UserPortalService } from './user-portal.service';

type AuthedRequest = Request & { user: AuthUser };

@Controller('user-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class UserPortalController {
  constructor(private readonly userPortalService: UserPortalService) {}

  @Get('me')
  getMe(@Req() req: AuthedRequest) {
    return this.userPortalService.getMe(req.user);
  }

  @Get('pocs')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  getPocs() {
    return this.userPortalService.getPocs();
  }

  @Get('pocs/:id')
  getPocDetail(@Param('id') id: string) {
    return this.userPortalService.getPocDetail(id);
  }

  @Post('feedback')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createFeedback(@Req() req: AuthedRequest, @Body() body: CreateFeedbackDto) {
    return this.userPortalService.createFeedback(req.user, body);
  }
}
