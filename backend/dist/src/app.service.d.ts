import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    getHealth(): Promise<{
        hint?: string | undefined;
        status: string;
        database: string;
        userCount: number;
        message?: undefined;
    } | {
        status: string;
        database: string;
        message: string;
        hint: string;
    }>;
}
