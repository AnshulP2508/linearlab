import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { ModerateFeedbackDto } from './dto/moderate-feedback.dto';
import { CreateAdminFeedbackDto } from './dto/create-admin-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { FeedbackService } from './feedback.service';

type AuthedRequest = Request & { user: AuthUser };

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll(@Query() query: QueryFeedbackDto) {
    return this.feedbackService.findAll(query);
  }

  @Patch(':id/moderate')
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateFeedbackDto,
    @Req() req: AuthedRequest,
  ) {
    return this.feedbackService.moderate(id, dto, req.user);
  }

  @Post()
  createAdminFeedback(
    @Body() dto: CreateAdminFeedbackDto,
    @Req() req: AuthedRequest,
  ) {
    return this.feedbackService.createAdminFeedback(dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.feedbackService.remove(id, req.user);
  }
}
