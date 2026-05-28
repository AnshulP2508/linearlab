import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { ModerateFeedbackDto } from './dto/moderate-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { CreateAdminFeedbackDto } from './dto/create-admin-feedback.dto';
export declare class FeedbackService {
    private readonly prisma;
    private readonly auditService;
    private readonly mongo;
    constructor(prisma: PrismaService, auditService: AdminAuditService, mongo: MongoDatabaseService);
    findAll(query: QueryFeedbackDto): Promise<{
        items: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    moderate(id: string, dto: ModerateFeedbackDto, actor: AuthUser): Promise<any>;
    remove(id: string, actor: AuthUser): Promise<{
        ok: boolean;
    }>;
    createAdminFeedback(dto: CreateAdminFeedbackDto, actor: AuthUser): Promise<{
        id: string;
        pocId: string;
        userId: string;
        rating: number;
        comment: string;
        type: string | undefined;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        poc: {
            id: string;
            title: string;
            status: string;
        };
        user: {
            id: string;
            name: any;
            email: any;
        };
    }>;
}
