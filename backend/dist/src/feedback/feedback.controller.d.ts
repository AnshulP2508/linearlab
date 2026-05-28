import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { ModerateFeedbackDto } from './dto/moderate-feedback.dto';
import { CreateAdminFeedbackDto } from './dto/create-admin-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { FeedbackService } from './feedback.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    findAll(query: QueryFeedbackDto): Promise<{
        items: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    moderate(id: string, dto: ModerateFeedbackDto, req: AuthedRequest): Promise<any>;
    createAdminFeedback(dto: CreateAdminFeedbackDto, req: AuthedRequest): Promise<{
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
    remove(id: string, req: AuthedRequest): Promise<{
        ok: boolean;
    }>;
}
export {};
