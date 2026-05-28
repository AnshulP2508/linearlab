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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { CreatePocDto } from './dto/create-poc.dto';
import { GenerateDocumentationDto } from './dto/generate-documentation.dto';
import { QueryPocsDto } from './dto/query-pocs.dto';
import { ReviewPocDto } from './dto/review-poc.dto';
import { UpdatePocDto } from './dto/update-poc.dto';
import { PocsService } from './pocs.service';

type AuthedRequest = Request & { user: AuthUser };

@Controller('pocs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PocsController {
  constructor(private readonly pocsService: PocsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  findAll(@Query() query: QueryPocsDto, @Req() req: AuthedRequest) {
    return this.pocsService.findAll(query, req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreatePocDto, @Req() req: AuthedRequest) {
    return this.pocsService.create(dto, req.user);
  }

  @Get('approvals')
  @Roles(Role.ADMIN)
  findPendingApprovals(@Query() query: QueryPocsDto) {
    return this.pocsService.findPendingApprovals(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.pocsService.findOne(id, req.user);
  }

  @Post(':id/documentation/generate')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  generateDocumentation(
    @Param('id') id: string,
    @Body() dto: GenerateDocumentationDto,
    @Req() req: AuthedRequest,
  ) {
    return this.pocsService.generateDocumentation(id, dto, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePocDto,
    @Req() req: AuthedRequest,
  ) {
    return this.pocsService.update(id, dto, req.user);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN)
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewPocDto,
    @Req() req: AuthedRequest,
  ) {
    return this.pocsService.approve(id, dto, req.user);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewPocDto,
    @Req() req: AuthedRequest,
  ) {
    return this.pocsService.reject(id, dto, req.user);
  }

  @Post(':id/pending')
  @Roles(Role.ADMIN)
  keepPending(
    @Param('id') id: string,
    @Body() dto: ReviewPocDto,
    @Req() req: AuthedRequest,
  ) {
    return this.pocsService.keepPending(id, dto, req.user);
  }

  @Post(':id/archive')
  @Roles(Role.ADMIN)
  archive(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.pocsService.archive(id, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.pocsService.remove(id, req.user);
  }
}
