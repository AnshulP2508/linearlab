import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto, req: AuthedRequest): Promise<{
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
    update(id: string, dto: UpdateUserDto, req: AuthedRequest): Promise<{
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
    remove(id: string, req: AuthedRequest): Promise<{
        ok: boolean;
    }>;
}
export {};
