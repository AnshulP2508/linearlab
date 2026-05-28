import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Filter, Sort } from 'mongodb';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { NotificationTypes } from '../common/admin-domain';
import {
  assertStrongPassword,
  MIN_BCRYPT_ROUNDS,
} from '../common/password-policy';
import { sanitizePlainText } from '../common/sanitize';
import { AuthSessionService } from '../auth/auth-session.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserDocument = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: string;
  team?: string | null;
  avatarUrl?: string | null;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mongo: MongoDatabaseService,
    private readonly config: ConfigService,
    private readonly auditService: AdminAuditService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async create(dto: CreateUserDto, actor: AuthUser) {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot create ADMIN');
    }

    const email = dto.email.trim().toLowerCase();
    const collection = await this.userCollection();
    const existing = await collection.findOne({ email });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    assertStrongPassword(dto.password);
    const rounds = Math.max(
      Number(this.config.get('BCRYPT_ROUNDS') ?? MIN_BCRYPT_ROUNDS),
      MIN_BCRYPT_ROUNDS,
    );
    const password = await bcrypt.hash(dto.password, rounds);
    const now = new Date();
    const document: UserDocument = {
      _id: randomUUID(),
      name: sanitizePlainText(dto.name) ?? dto.name.trim(),
      email,
      password,
      role: dto.role,
      status: AccountStatus.ACTIVE,
      team: null,
      avatarUrl: null,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await collection.insertOne(document);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }

    const result = this.toUserListItem(document);

    await this.auditService.record({
      actor,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: result.id,
      metadata: { email: result.email, role: result.role },
      notification: {
        type: NotificationTypes.USER_CREATED,
        title: 'New user created',
        message: `${result.name} was added as ${result.role}.`,
      },
    });

    return result;
  }

  async findAll(query: QueryUsersDto) {
    const collection = await this.userCollection();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const filter = this.buildMongoFilter(query);
    const sort = this.resolveMongoSort(query.sortBy, query.sortOrder);

    const [items, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => this.toUserListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot promote users to ADMIN');
    }

    const collection = await this.userCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const nextEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    if (nextEmail && nextEmail !== existing.email.toLowerCase()) {
      const duplicate = await collection.findOne({ email: nextEmail });
      if (duplicate) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatePayload: Partial<UserDocument> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) {
      updatePayload.name = sanitizePlainText(dto.name) ?? dto.name.trim();
    }
    if (nextEmail !== undefined) updatePayload.email = nextEmail;
    if (dto.role !== undefined) updatePayload.role = dto.role;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.team !== undefined) {
      updatePayload.team = sanitizePlainText(dto.team) ?? null;
    }
    if (dto.avatarUrl !== undefined) {
      updatePayload.avatarUrl = dto.avatarUrl.trim();
    }

    if (
      dto.status !== undefined &&
      dto.status !== AccountStatus.ACTIVE &&
      dto.status !== existing.status
    ) {
      await this.authSessions.revokeAllForUser(id);
    }

    await collection.updateOne({ _id: id }, { $set: updatePayload });
    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('User not found after update');
    }

    const result = this.toUserListItem(updated);

    await this.auditService.record({
      actor,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: result.id,
      metadata: {
        before: {
          name: existing.name,
          email: existing.email,
          role: existing.role,
          status: existing.status,
          team: existing.team,
        },
        after: {
          name: result.name,
          email: result.email,
          role: result.role,
          status: result.status,
          team: result.team,
        },
      },
      notification: {
        type: NotificationTypes.USER_UPDATED,
        title: 'User updated',
        message: `${result.name}'s account details were updated.`,
      },
    });

    return result;
  }

  async remove(id: string, actor: AuthUser) {
    if (id === actor.userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const collection = await this.userCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const deleteResult = await collection.deleteOne({ _id: id });
    if (!deleteResult.deletedCount) {
      throw new NotFoundException('User not found');
    }

    await this.auditService.record({
      actor,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: { email: existing.email, role: existing.role },
      notification: {
        type: NotificationTypes.USER_DELETED,
        title: 'User deleted',
        message: `${existing.name} was removed from the platform.`,
      },
    });

    return { ok: true };
  }

  async getDeveloperDirectory(query: QueryUsersDto) {
    const prisma = this.prisma as any;
    const result = await this.findAll({
      ...query,
      role: Role.DEVELOPER,
    });

    const items = await Promise.all(
      result.items.map(async (developer: any) => {
        const stats = await prisma.pOC.aggregate({
          where: { developerId: developer.id },
          _count: { _all: true },
          _avg: { ratingAverage: true },
          _sum: { activeDemoCount: true },
        });
        const publishedCount = await prisma.pOC.count({
          where: { developerId: developer.id, status: 'PUBLISHED' },
        });

        return {
          ...developer,
          totalPocs: Number(stats?._count?._all ?? 0),
          publishedPocs: Number(publishedCount ?? 0),
          averageRating: Number(stats?._avg?.ratingAverage ?? 0),
          activeDemos: Number(stats?._sum?.activeDemoCount ?? 0),
        };
      }),
    );

    return {
      ...result,
      items,
    };
  }

  private async userCollection() {
    const db = await this.mongo.getDb();
    return db.collection<UserDocument>('User');
  }

  private buildMongoFilter(query: QueryUsersDto): Filter<UserDocument> {
    const filter: Filter<UserDocument> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { team: searchRegex },
      ];
    }

    return filter;
  }

  private resolveMongoSort(
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Sort {
    const allowed = new Set([
      'name',
      'email',
      'role',
      'status',
      'createdAt',
      'updatedAt',
      'lastActiveAt',
    ]);
    const field = allowed.has(sortBy) ? sortBy : 'createdAt';
    return [[field, sortOrder === 'asc' ? 1 : -1]];
  }

  private toUserListItem(user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      team: user.team ?? null,
      avatarUrl: user.avatarUrl ?? null,
      lastActiveAt: user.lastActiveAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
