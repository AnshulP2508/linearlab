import { ConfigService } from '@nestjs/config';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { AuthSessionService } from '../auth/auth-session.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly mongo;
    private readonly config;
    private readonly auditService;
    private readonly authSessions;
    constructor(prisma: PrismaService, mongo: MongoDatabaseService, config: ConfigService, auditService: AdminAuditService, authSessions: AuthSessionService);
    create(dto: CreateUserDto, actor: AuthUser): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        team: string | null;
        avatarUrl: string | null;
        lastActiveAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query: QueryUsersDto): Promise<{
        items: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            status: string;
            team: string | null;
            avatarUrl: string | null;
            lastActiveAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    update(id: string, dto: UpdateUserDto, actor: AuthUser): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        team: string | null;
        avatarUrl: string | null;
        lastActiveAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, actor: AuthUser): Promise<{
        ok: boolean;
    }>;
    getDeveloperDirectory(query: QueryUsersDto): Promise<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    private userCollection;
    private buildMongoFilter;
    private resolveMongoSort;
    private toUserListItem;
}
