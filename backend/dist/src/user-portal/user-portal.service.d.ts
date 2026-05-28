import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { AuthUser } from '../common/auth-user';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
type DeveloperFile = {
    id: string;
    name: string;
    type: string;
    mimeType?: string | null;
    contentBase64?: string | null;
    sizeBytes?: number | null;
    uploadedAt: Date;
};
type ExplanationVideo = {
    id: string;
    type: 'file' | 'url';
    value: string;
    thumbnailUrl: string;
    uploadedAt: Date;
};
type DemoUrls = {
    liveDemoUrl?: string | null;
    githubRepositoryUrl?: string | null;
    videoLinkUrl?: string | null;
};
type DeveloperWorkspace = {
    uploadedFiles?: DeveloperFile[] | null;
    demoUrls?: DemoUrls | null;
    explanationVideo?: ExplanationVideo | null;
    documentationDraft?: {
        purpose?: string | null;
        problemItSolves?: string | null;
        howToUseIt?: string | null;
        techStack?: string | null;
        teamBehindIt?: string | null;
    } | null;
};
export declare class UserPortalService {
    private readonly mongo;
    constructor(mongo: MongoDatabaseService);
    getMe(actor: AuthUser): Promise<{
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
        developerWorkspace: DeveloperWorkspace | null;
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
    createFeedback(actor: AuthUser, body: CreateFeedbackDto): Promise<{
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
    private buildDocuments;
    private buildDemos;
    private toUserPocSummary;
    private loadFeedbackForPocIds;
    private loadUsersByIds;
    private loadCategoriesByIds;
    private requireUser;
    private userCollection;
    private pocCollection;
    private feedbackCollection;
    private categoryCollection;
}
export {};
