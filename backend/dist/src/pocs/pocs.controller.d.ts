import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { CreatePocDto } from './dto/create-poc.dto';
import { GenerateDocumentationDto } from './dto/generate-documentation.dto';
import { QueryPocsDto } from './dto/query-pocs.dto';
import { ReviewPocDto } from './dto/review-poc.dto';
import { UpdatePocDto } from './dto/update-poc.dto';
import { PocsService } from './pocs.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class PocsController {
    private readonly pocsService;
    constructor(pocsService: PocsService);
    findAll(query: QueryPocsDto, req: AuthedRequest): Promise<{
        items: {
            id: string;
            title: string;
            slug: string;
            summary: string;
            description: string;
            demoUrl: string | null;
            documentation: string | null;
            technologies: string[];
            status: string;
            views: number;
            downloads: number;
            activeDemoCount: number;
            ratingAverage: number;
            ratingCount: number;
            developerId: string;
            categoryId: string | null;
            reviewerId: string | null;
            reviewNotes: string | null;
            rejectedReason: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            developer: {
                id: string;
                name: string;
                email: string;
                team?: string | null;
                avatarUrl?: string | null;
            } | undefined;
            category: {
                id: string;
                name: string;
                color?: string | null;
            } | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: CreatePocDto, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    findPendingApprovals(query: QueryPocsDto): Promise<{
        items: {
            id: string;
            title: string;
            slug: string;
            summary: string;
            description: string;
            demoUrl: string | null;
            documentation: string | null;
            technologies: string[];
            status: string;
            views: number;
            downloads: number;
            activeDemoCount: number;
            ratingAverage: number;
            ratingCount: number;
            developerId: string;
            categoryId: string | null;
            reviewerId: string | null;
            reviewNotes: string | null;
            rejectedReason: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            developer: {
                id: string;
                name: string;
                email: string;
                team?: string | null;
                avatarUrl?: string | null;
            } | undefined;
            category: {
                id: string;
                name: string;
                color?: string | null;
            } | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string, req: AuthedRequest): Promise<{
        reviewer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | null;
        developerWorkspace: {
            uploadedFiles: {
                id: string;
                name: string;
                type: string;
                mimeType?: string | null;
                contentBase64?: string | null;
                sizeBytes?: number | null;
                uploadedAt: Date;
            }[];
            demoUrls: {
                liveDemoUrl?: string | null;
                githubRepositoryUrl?: string | null;
                videoLinkUrl?: string | null;
            };
            explanationVideo: {
                id: string;
                type: "file" | "url";
                value: string;
                thumbnailUrl: string;
                uploadedAt: Date;
            } | null;
            documentationDraft: {
                purpose?: string | null;
                problemItSolves?: string | null;
                howToUseIt?: string | null;
                techStack?: string | null;
                teamBehindIt?: string | null;
            } | null;
        };
        feedback: {
            id: string;
            pocId: string;
            userId: string;
            rating: number;
            comment: string;
            type: string;
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
                name: string;
                email: string;
                team?: string | null;
                avatarUrl?: string | null;
            };
        }[];
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    generateDocumentation(id: string, dto: GenerateDocumentationDto, req: AuthedRequest): Promise<{
        section: "purpose" | "problemItSolves" | "howToUseIt";
        content: string;
        model: string;
        truncated: boolean;
    }>;
    update(id: string, dto: UpdatePocDto, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    approve(id: string, dto: ReviewPocDto, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    reject(id: string, dto: ReviewPocDto, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    keepPending(id: string, dto: ReviewPocDto, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    archive(id: string, req: AuthedRequest): Promise<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        description: string;
        demoUrl: string | null;
        documentation: string | null;
        technologies: string[];
        status: string;
        views: number;
        downloads: number;
        activeDemoCount: number;
        ratingAverage: number;
        ratingCount: number;
        developerId: string;
        categoryId: string | null;
        reviewerId: string | null;
        reviewNotes: string | null;
        rejectedReason: string | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        developer: {
            id: string;
            name: string;
            email: string;
            team?: string | null;
            avatarUrl?: string | null;
        } | undefined;
        category: {
            id: string;
            name: string;
            color?: string | null;
        } | null;
    }>;
    remove(id: string, req: AuthedRequest): Promise<{
        ok: boolean;
    }>;
}
export {};
