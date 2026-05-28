declare const stages: readonly ["ASSIGNED", "IN_PROGRESS", "DEVELOPMENT_COMPLETED", "UNDER_ADMIN_REVIEW", "PUBLISHED"];
declare class UploadedFileDto {
    name: string;
    mimeType?: string;
    contentBase64?: string;
    sizeBytes?: number;
}
declare class DemoUrlsDto {
    liveDemoUrl?: string;
    githubRepositoryUrl?: string;
    videoLinkUrl?: string;
}
declare class DocumentationDraftDto {
    purpose?: string;
    problemItSolves?: string;
    howToUseIt?: string;
    techStack?: string;
    teamBehindIt?: string;
}
export declare class UpdateDeveloperPocDto {
    status?: (typeof stages)[number];
    addFiles?: UploadedFileDto[];
    deleteFileId?: string;
    demoUrls?: DemoUrlsDto;
    explanationVideoFileName?: string;
    documentationDraft?: DocumentationDraftDto;
    note?: string;
    submitForReview?: boolean;
}
export {};
