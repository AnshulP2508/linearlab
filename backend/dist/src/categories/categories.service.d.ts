import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private readonly mongo;
    private readonly auditService;
    constructor(mongo: MongoDatabaseService, auditService: AdminAuditService);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        usageCount: number;
    }[]>;
    create(dto: CreateCategoryDto, actor: AuthUser): Promise<{
        id: string;
        name: string;
        description: string | null | undefined;
        color: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateCategoryDto, actor: AuthUser): Promise<{
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, actor: AuthUser): Promise<{
        ok: boolean;
    }>;
    private isDuplicateKeyError;
    private categoryCollection;
    private pocCollection;
}
