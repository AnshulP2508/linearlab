import { Role } from '@prisma/client';
export declare class QueryUsersDto {
    search?: string;
    role?: Role;
    status?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
