import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UserPortalService } from './user-portal.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class UserPortalController {
    private readonly userPortalService;
    constructor(userPortalService: UserPortalService);
    getMe(req: AuthedRequest): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        team: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPocs(): Promise<{
        items: {
            id: string;
            title: string;
            slug: string;
            summary: string;
            description: string;
            technologies: string[];
            category: {
                id: string;
                name: string;
                color?: string | null;
            } | null;
            developer: {
                id: string;
                name: string;
                email: string;
                team?: string | null;
                avatarUrl?: string | null;
                createdAt: Date;
            } | null;
            createdAt: Date;
            updatedAt: Date;
            ratingAverage: number;
            ratingCount: number;
            feedbacks: {
                id: string;
                pocId: string;
                userId: string;
                rating: number;
                comment: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl?: string | null;
                };
            }[];
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getPocDetail(id: string): Promise<{
        documents: {
            id: string;
            name: string;
            type: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
            contentBase64: string | null;
        }[];
        demos: ({
            id: string;
            label: string;
            type: string;
            value: string;
            thumbnailUrl?: undefined;
            uploadedAt?: undefined;
        } | {
            id: string;
            label: string;
            type: "url" | "file";
            value: string;
            thumbnailUrl: string;
            uploadedAt: Date;
        } | null)[];
        feedbacks: {
            id: string;
            pocId: string;
            userId: string;
            rating: number;
            comment: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl?: string | null;
            };
        }[];
        developerWorkspace: {
            uploadedFiles?: {
                id: string;
                name: string;
                type: string;
                mimeType?: string | null;
                contentBase64?: string | null;
                sizeBytes?: number | null;
                uploadedAt: Date;
            }[] | null;
            demoUrls?: {
                liveDemoUrl?: string | null;
                githubRepositoryUrl?: string | null;
                videoLinkUrl?: string | null;
            } | null;
            explanationVideo?: {
                id: string;
                type: "file" | "url";
                value: string;
                thumbnailUrl: string;
                uploadedAt: Date;
            } | null;
            documentationDraft?: {
                purpose?: string | null;
                problemItSolves?: string | null;
                howToUseIt?: string | null;
                techStack?: string | null;
                teamBehindIt?: string | null;
            } | null;
        } | null;
        fullDescription: string;
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        technologies: string[];
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
            createdAt: Date;
        } | null;
        createdAt: Date;
        updatedAt: Date;
        ratingAverage: number;
        ratingCount: number;
    }>;
    createFeedback(req: AuthedRequest, body: CreateFeedbackDto): Promise<{
        id: string;
        pocId: string;
        userId: string;
        rating: number;
        comment: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    }>;
}
export {};
