import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateDeveloperPocDto } from './dto/update-developer-poc.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeveloperWorkspaceService } from './developer-workspace.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class DeveloperWorkspaceController {
    private readonly developerWorkspaceService;
    constructor(developerWorkspaceService: DeveloperWorkspaceService);
    getMe(req: AuthedRequest): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        skills: string[];
        team: string;
        stats: {
            totalAssignedPocs: number;
            inProgress: number;
            completed: number;
            underReview: number;
        };
    }>;
    getAssignedPocs(req: AuthedRequest, status?: string, priority?: string, deadline?: string, search?: string): Promise<{
        id: string;
        title: string;
        slug: string;
        assignedBy: string;
        assignedDate: string;
        deadline: string;
        priority: "HIGH" | "MEDIUM" | "LOW";
        stage: "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DEVELOPMENT_COMPLETED" | "UNDER_ADMIN_REVIEW";
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: {
            liveDemoUrl?: string | null;
            githubRepositoryUrl?: string | null;
            videoLinkUrl?: string | null;
        };
        hasExplanationVideo: boolean;
    }[]>;
    getPocDetail(req: AuthedRequest, id: string): Promise<{
        adminInfo: {
            problemStatement: string;
            businessRequirements: string;
            technicalRequirements: string;
            suggestedTechStack: string[];
            supportDocuments: string[];
            referenceLinks: string[];
            deadline: string;
        };
        developerWorkspace: {
            status: "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DEVELOPMENT_COMPLETED" | "UNDER_ADMIN_REVIEW";
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
            notes: {
                id: string;
                message: string;
                createdAt: Date;
                authorEmail: string;
            }[];
            submittedForReviewAt?: Date | null;
            updatedAt: Date;
        };
        feedback: {
            id: string;
            pocId: string;
            rating: number;
            comment: string;
            type: "USER_FEEDBACK" | "ADMIN_COMMENT" | "BUG_REPORT" | "IMPROVEMENT_SUGGESTION";
            status: string;
            user: {
                id: string;
                name: string;
            };
            createdAt: string;
        }[];
        id: string;
        title: string;
        slug: string;
        assignedBy: string;
        assignedDate: string;
        deadline: string;
        priority: "HIGH" | "MEDIUM" | "LOW";
        stage: "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DEVELOPMENT_COMPLETED" | "UNDER_ADMIN_REVIEW";
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: {
            liveDemoUrl?: string | null;
            githubRepositoryUrl?: string | null;
            videoLinkUrl?: string | null;
        };
        hasExplanationVideo: boolean;
    }>;
    updatePoc(req: AuthedRequest, id: string, body: UpdateDeveloperPocDto): Promise<{
        adminInfo: {
            problemStatement: string;
            businessRequirements: string;
            technicalRequirements: string;
            suggestedTechStack: string[];
            supportDocuments: string[];
            referenceLinks: string[];
            deadline: string;
        };
        developerWorkspace: {
            status: "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DEVELOPMENT_COMPLETED" | "UNDER_ADMIN_REVIEW";
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
            notes: {
                id: string;
                message: string;
                createdAt: Date;
                authorEmail: string;
            }[];
            submittedForReviewAt?: Date | null;
            updatedAt: Date;
        };
        feedback: {
            id: string;
            pocId: string;
            rating: number;
            comment: string;
            type: "USER_FEEDBACK" | "ADMIN_COMMENT" | "BUG_REPORT" | "IMPROVEMENT_SUGGESTION";
            status: string;
            user: {
                id: string;
                name: string;
            };
            createdAt: string;
        }[];
        id: string;
        title: string;
        slug: string;
        assignedBy: string;
        assignedDate: string;
        deadline: string;
        priority: "HIGH" | "MEDIUM" | "LOW";
        stage: "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DEVELOPMENT_COMPLETED" | "UNDER_ADMIN_REVIEW";
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: {
            liveDemoUrl?: string | null;
            githubRepositoryUrl?: string | null;
            videoLinkUrl?: string | null;
        };
        hasExplanationVideo: boolean;
    }>;
    getFeedback(req: AuthedRequest, type?: string, pocId?: string): Promise<{
        id: string;
        pocId: string;
        rating: number;
        comment: string;
        type: "USER_FEEDBACK" | "ADMIN_COMMENT" | "BUG_REPORT" | "IMPROVEMENT_SUGGESTION";
        status: string;
        user: {
            id: string;
            name: string;
        };
        createdAt: string;
    }[]>;
    updateProfile(req: AuthedRequest, body: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        skills: string[];
        team: string;
        stats: {
            totalAssignedPocs: number;
            inProgress: number;
            completed: number;
            underReview: number;
        };
    }>;
    changePassword(req: AuthedRequest, body: ChangePasswordDto): Promise<{
        ok: boolean;
    }>;
}
export {};
