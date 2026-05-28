import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        usageCount: number;
    }[]>;
    create(dto: CreateCategoryDto, req: AuthedRequest): Promise<{
        id: string;
        name: string;
        description: string | null | undefined;
        color: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateCategoryDto, req: AuthedRequest): Promise<{
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: AuthedRequest): Promise<{
        ok: boolean;
    }>;
}
export {};
