import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
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
