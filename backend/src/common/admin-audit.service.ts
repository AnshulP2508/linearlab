import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { AuthUser } from './auth-user';
import { NotificationType } from './admin-domain';

type ActivityLogDocument = {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedById: string;
  performedByEmail: string;
  metadata: Prisma.InputJsonValue | Record<string, unknown> | null;
  createdAt: Date;
};

type AdminNotificationDocument = {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  read: boolean;
  createdAt: Date;
};

type AuditEvent = {
  actor: AuthUser;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue | Record<string, unknown>;
  notification?: {
    type: NotificationType;
    title: string;
    message: string;
  };
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly mongo: MongoDatabaseService) {}

  async record(event: AuditEvent) {
    const db = await this.mongo.getDb();
    const now = new Date();

    const activity: ActivityLogDocument = {
      _id: randomUUID(),
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      performedById: event.actor.userId,
      performedByEmail: event.actor.email,
      metadata: event.metadata ?? null,
      createdAt: now,
    };
    await db.collection<ActivityLogDocument>('ActivityLog').insertOne(activity);

    if (event.notification) {
      const notification: AdminNotificationDocument = {
        _id: randomUUID(),
        type: event.notification.type,
        title: event.notification.title,
        message: event.notification.message,
        entityType: event.entityType,
        entityId: event.entityId,
        read: false,
        createdAt: now,
      };
      await db
        .collection<AdminNotificationDocument>('AdminNotification')
        .insertOne(notification);
    }
  }
}
