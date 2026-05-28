import { Prisma } from '@prisma/client';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { AuthUser } from './auth-user';
import { NotificationType } from './admin-domain';
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
export declare class AdminAuditService {
    private readonly mongo;
    constructor(mongo: MongoDatabaseService);
    record(event: AuditEvent): Promise<void>;
}
export {};
