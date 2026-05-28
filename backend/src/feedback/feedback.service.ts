import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { NotificationTypes } from '../common/admin-domain';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { sanitizeMultilineText } from '../common/sanitize';
import { ModerateFeedbackDto } from './dto/moderate-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { CreateAdminFeedbackDto } from './dto/create-admin-feedback.dto';

type FeedbackDocument = {
  _id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly mongo: MongoDatabaseService,
  ) {}

  async findAll(query: QueryFeedbackDto) {
    const prisma = this.prisma as any;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.pocId) {
      where.pocId = query.pocId;
    }

    if (query.search) {
      where.OR = [
        { comment: { contains: query.search } },
        {
          poc: {
            is: {
              title: { contains: query.search },
            },
          },
        },
        {
          user: {
            is: {
              name: { contains: query.search },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        select: {
          id: true,
          pocId: true,
          userId: true,
          rating: true,
          comment: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          poc: {
            select: { id: true, title: true, status: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async moderate(id: string, dto: ModerateFeedbackDto, actor: AuthUser) {
    const prisma = this.prisma as any;
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status: dto.status },
      include: {
        poc: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    await this.auditService.record({
      actor,
      action: 'FEEDBACK_MODERATED',
      entityType: 'Feedback',
      entityId: updated.id,
      metadata: {
        previousStatus: feedback.status,
        nextStatus: updated.status,
      },
      notification: {
        type: NotificationTypes.FEEDBACK_MODERATED,
        title: 'Feedback moderated',
        message: `Feedback on ${updated.poc.title} is now ${updated.status.toLowerCase()}.`,
      },
    });

    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    const prisma = this.prisma as any;
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        poc: { select: { title: true } },
        user: { select: { name: true } },
      },
    });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    await prisma.feedback.delete({ where: { id } });

    await this.auditService.record({
      actor,
      action: 'FEEDBACK_DELETED',
      entityType: 'Feedback',
      entityId: id,
      metadata: { pocTitle: feedback.poc.title, userName: feedback.user.name },
      notification: {
        type: NotificationTypes.FEEDBACK_MODERATED,
        title: 'Feedback removed',
        message: `A comment on ${feedback.poc.title} was deleted.`,
      },
    });

    return { ok: true };
  }

  async createAdminFeedback(dto: CreateAdminFeedbackDto, actor: AuthUser) {
    const comment = sanitizeMultilineText(dto.comment) ?? dto.comment.trim();
    if (!comment) {
      throw new BadRequestException('Comment is required');
    }

    const db = await this.mongo.getDb();
    const pocCollection = db.collection<{ _id: string; title: string; status: string }>(
      'POC',
    );
    const feedbackCollection = db.collection<FeedbackDocument>('Feedback');

    const poc = await pocCollection.findOne({ _id: dto.pocId } as { _id: string });
    if (!poc) {
      throw new NotFoundException('POC not found');
    }

    const now = new Date();
    const feedback: FeedbackDocument = {
      _id: randomUUID(),
      pocId: dto.pocId,
      userId: actor.userId,
      rating: dto.rating ?? 0,
      comment,
      type: 'ADMIN_COMMENT',
      status: 'VISIBLE',
      createdAt: now,
      updatedAt: now,
    };

    await feedbackCollection.insertOne(feedback);

    const adminUser = await (this.prisma as any).user.findUnique({
      where: { id: actor.userId },
      select: { name: true, email: true },
    });

    await this.auditService.record({
      actor,
      action: 'FEEDBACK_CREATED',
      entityType: 'Feedback',
      entityId: feedback._id,
      metadata: { pocTitle: poc.title, pocId: dto.pocId },
      notification: {
        type: NotificationTypes.FEEDBACK_RECEIVED,
        title: 'Admin feedback submitted',
        message: `Feedback was added for "${poc.title}".`,
      },
    });

    return {
      id: feedback._id,
      pocId: feedback.pocId,
      userId: feedback.userId,
      rating: feedback.rating,
      comment: feedback.comment,
      type: feedback.type,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      poc: {
        id: String(poc._id),
        title: poc.title,
        status: poc.status,
      },
      user: {
        id: actor.userId,
        name: adminUser?.name ?? 'Admin',
        email: adminUser?.email ?? actor.email,
      },
    };
  }
}
