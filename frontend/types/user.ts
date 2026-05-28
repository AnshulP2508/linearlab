export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  team?: string | null;
  role: "USER";
  createdAt: string;
  updatedAt: string;
};

export type UserFeedbackItem = {
  id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  status: "VISIBLE" | "HIDDEN" | "FLAGGED";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export type UserPocSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  technologies: string[];
  category?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  developer?: {
    id: string;
    name: string;
    email: string;
    team?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  ratingAverage: number;
  ratingCount: number;
  feedbacks: UserFeedbackItem[];
};

export type UserPocDetail = UserPocSummary & {
  fullDescription: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    uploadedAt: string;
    contentBase64?: string | null;
  }>;
  demos: Array<{
    id: string;
    label: string;
    type: "url" | "file";
    value: string;
    thumbnailUrl?: string;
    uploadedAt?: string;
  }>;
  feedbacks: UserFeedbackItem[];
  developerWorkspace?: {
    uploadedFiles?: Array<{
      id: string;
      name: string;
      type: string;
      mimeType?: string | null;
      contentBase64?: string | null;
      sizeBytes?: number | null;
      uploadedAt: string;
    }> | null;
    demoUrls?: {
      liveDemoUrl?: string | null;
      githubRepositoryUrl?: string | null;
      videoLinkUrl?: string | null;
    } | null;
    documentationDraft?: {
      purpose?: string | null;
      problemItSolves?: string | null;
      howToUseIt?: string | null;
      techStack?: string | null;
      teamBehindIt?: string | null;
    } | null;
  } | null;
};
