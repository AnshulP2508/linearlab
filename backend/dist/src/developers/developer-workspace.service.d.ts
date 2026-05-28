import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../common/auth-user';
import { UploadSecurityService } from '../common/upload-security.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
type DeveloperStage = 'ASSIGNED' | 'IN_PROGRESS' | 'DEVELOPMENT_COMPLETED' | 'UNDER_ADMIN_REVIEW' | 'PUBLISHED';
type FeedbackKind = 'USER_FEEDBACK' | 'ADMIN_COMMENT' | 'BUG_REPORT' | 'IMPROVEMENT_SUGGESTION';
type DeveloperFile = {
    id: string;
    name: string;
    type: string;
    mimeType?: string | null;
    contentBase64?: string | null;
    sizeBytes?: number | null;
    uploadedAt: Date;
};
type DemoUrls = {
    liveDemoUrl?: string | null;
    githubRepositoryUrl?: string | null;
    videoLinkUrl?: string | null;
};
type ExplanationVideo = {
    id: string;
    type: 'file' | 'url';
    value: string;
    thumbnailUrl: string;
    uploadedAt: Date;
};
type DeveloperNote = {
    id: string;
    message: string;
    createdAt: Date;
    authorEmail: string;
};
type DeveloperWorkspace = {
    status: DeveloperStage;
    uploadedFiles: DeveloperFile[];
    demoUrls: DemoUrls;
    explanationVideo?: ExplanationVideo | null;
    documentationDraft?: {
        purpose?: string | null;
        problemItSolves?: string | null;
        howToUseIt?: string | null;
        techStack?: string | null;
        teamBehindIt?: string | null;
    } | null;
    notes: DeveloperNote[];
    submittedForReviewAt?: Date | null;
    updatedAt: Date;
};
type DeveloperPocUpdateDto = {
    status?: DeveloperStage;
    addFiles?: Array<{
        name: string;
        mimeType?: string;
        contentBase64?: string;
        sizeBytes?: number;
    }>;
    deleteFileId?: string;
    demoUrls?: DemoUrls;
    explanationVideoFileName?: string;
    documentationDraft?: {
        purpose?: string;
        problemItSolves?: string;
        howToUseIt?: string;
        techStack?: string;
        teamBehindIt?: string;
    };
    note?: string;
    submitForReview?: boolean;
};
type DeveloperProfileUpdateDto = {
    name?: string;
    avatarUrl?: string;
    skills?: string[];
};
type DeveloperPasswordChangeDto = {
    currentPassword?: string;
    newPassword?: string;
};
export declare class DeveloperWorkspaceService {
    private readonly mongo;
    private readonly config;
    private readonly uploadSecurity;
    private readonly authSessions;
    constructor(mongo: MongoDatabaseService, config: ConfigService, uploadSecurity: UploadSecurityService, authSessions: AuthSessionService);
    getMe(actor: AuthUser): Promise<{
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
    getAssignedPocs(actor: AuthUser, query: {
        status?: string;
        priority?: string;
        deadline?: string;
        search?: string;
    }): Promise<{
        id: string;
        title: string;
        slug: string;
        assignedBy: string;
        assignedDate: string;
        deadline: string;
        priority: "HIGH" | "MEDIUM" | "LOW";
        stage: DeveloperStage;
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: DemoUrls;
        hasExplanationVideo: boolean;
    }[]>;
    getPocDetail(actor: AuthUser, pocId: string): Promise<{
        adminInfo: {
            problemStatement: string;
            businessRequirements: string;
            technicalRequirements: string;
            suggestedTechStack: string[];
            supportDocuments: string[];
            referenceLinks: string[];
            deadline: string;
        };
        developerWorkspace: DeveloperWorkspace;
        feedback: {
            id: string;
            pocId: string;
            rating: number;
            comment: string;
            type: FeedbackKind;
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
        stage: DeveloperStage;
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: DemoUrls;
        hasExplanationVideo: boolean;
    }>;
    updatePoc(actor: AuthUser, pocId: string, dto: DeveloperPocUpdateDto): Promise<{
        adminInfo: {
            problemStatement: string;
            businessRequirements: string;
            technicalRequirements: string;
            suggestedTechStack: string[];
            supportDocuments: string[];
            referenceLinks: string[];
            deadline: string;
        };
        developerWorkspace: DeveloperWorkspace;
        feedback: {
            id: string;
            pocId: string;
            rating: number;
            comment: string;
            type: FeedbackKind;
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
        stage: DeveloperStage;
        summary: string;
        description: string;
        technologies: string[];
        documentationCount: number;
        demoUrls: DemoUrls;
        hasExplanationVideo: boolean;
    }>;
    getFeedback(actor: AuthUser, query: {
        type?: string;
        pocId?: string;
    }): Promise<{
        id: string;
        pocId: string;
        rating: number;
        comment: string;
        type: FeedbackKind;
        status: string;
        user: {
            id: string;
            name: string;
        };
        createdAt: string;
    }[]>;
    updateProfile(actor: AuthUser, dto: DeveloperProfileUpdateDto): Promise<{
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
    changePassword(actor: AuthUser, dto: DeveloperPasswordChangeDto): Promise<{
        ok: boolean;
    }>;
    private shouldHideFromDeveloperFeedback;
    private getFeedbackForPoc;
    private toDeveloperPocSummary;
    private buildAdminInfo;
    private buildDeveloperWorkspace;
    private resolveStage;
    private assertForwardOnlyStatus;
    private requireDeveloper;
    private requireOwnedPoc;
    private loadUsersByIds;
    private defaultDeadline;
    private detectFileType;
    private buildVideoThumbnail;
    private userCollection;
    private pocCollection;
    private feedbackCollection;
}
export {};
