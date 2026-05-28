export type DeveloperStage =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DEVELOPMENT_COMPLETED"
  | "UNDER_ADMIN_REVIEW"
  | "PUBLISHED";

export type DeveloperPriority = "HIGH" | "MEDIUM" | "LOW";

export type DemoUrls = {
  liveDemoUrl?: string | null;
  githubRepositoryUrl?: string | null;
  videoLinkUrl?: string | null;
};

export type DeveloperFile = {
  id: string;
  name: string;
  type: string;
  mimeType?: string | null;
  contentBase64?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
};

export type DeveloperNote = {
  id: string;
  message: string;
  createdAt: string;
  authorEmail: string;
};

export type ExplanationVideo = {
  id: string;
  type: "file" | "url";
  value: string;
  thumbnailUrl: string;
  uploadedAt: string;
};

export type DeveloperProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  skills: string[];
  team?: string | null;
  stats: {
    totalAssignedPocs: number;
    inProgress: number;
    completed: number;
    underReview: number;
  };
};

export type DeveloperPocSummary = {
  id: string;
  title: string;
  slug: string;
  assignedBy: string;
  assignedDate: string;
  deadline: string;
  priority: DeveloperPriority;
  stage: DeveloperStage;
  summary: string;
  description: string;
  technologies: string[];
  documentationCount: number;
  demoUrls: DemoUrls;
  hasExplanationVideo: boolean;
};

export type DeveloperFeedbackType =
  | "USER_FEEDBACK"
  | "ADMIN_COMMENT"
  | "BUG_REPORT"
  | "IMPROVEMENT_SUGGESTION";

export type DeveloperFeedbackItem = {
  id: string;
  pocId: string;
  rating: number;
  comment: string;
  type: DeveloperFeedbackType;
  status: string;
  user: { id: string; name: string };
  createdAt: string;
};

export type DeveloperPocDetail = DeveloperPocSummary & {
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
    submittedForReviewAt?: string | null;
    updatedAt: string;
  };
  feedback: DeveloperFeedbackItem[];
};

export type DeveloperPocUpdatePayload = {
  status?: DeveloperStage;
  addFiles?: Array<
    | string
    | {
        name: string;
        mimeType?: string;
        contentBase64?: string;
        sizeBytes?: number;
      }
  >;
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
