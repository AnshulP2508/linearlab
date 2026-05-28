export type AdminDashboardSummary = {
  summary: {
    totalPocs: number;
    totalDevelopers: number;
    totalUsers: number;
    pendingApprovals: number;
    activeDemos: number;
    averageRating: number;
    unreadNotifications: number;
  };
  recentActivity: AdminActivityItem[];
  pendingApprovals: PocListItem[];
  categoryCounts: Array<{ id: string; name: string; color?: string | null; total: number }>;
  techDistribution: Array<{ name: string; total: number }>;
  userGrowth: Array<{ label: string; value: number }>;
};

export type DashboardRange = "day" | "month" | "year";

export type AdminActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedById: string;
  performedByEmail: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
  createdAt: string;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DEVELOPER" | "USER";
  status: "ACTIVE" | "DISABLED" | "SUSPENDED";
  team?: string | null;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { pocs: number };
};

export type DeveloperListItem = UserListItem & {
  totalPocs: number;
  publishedPocs: number;
  averageRating: number;
  activeDemos: number;
};

export type PocListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  demoUrl?: string | null;
  documentation?: string | null;
  technologies: string[];
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  views: number;
  downloads: number;
  activeDemoCount: number;
  ratingAverage: number;
  ratingCount: number;
  developerId: string;
  categoryId?: string | null;
  reviewerId?: string | null;
  reviewNotes?: string | null;
  rejectedReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  developer?: { id: string; name: string; email?: string };
  category?: { id: string; name: string; color?: string | null } | null;
};

export type PocDetail = PocListItem & {
  reviewer?: { id: string; name: string; email: string } | null;
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
    explanationVideo?: {
      id: string;
      type: "file" | "url";
      value: string;
      thumbnailUrl: string;
      uploadedAt: string;
    } | null;
    documentationDraft?: {
      purpose?: string | null;
      problemItSolves?: string | null;
      howToUseIt?: string | null;
      techStack?: string | null;
      teamBehindIt?: string | null;
    } | null;
  } | null;
  feedback: FeedbackItem[];
};

export type FeedbackItem = {
  id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  type?: string;
  status: "VISIBLE" | "HIDDEN" | "FLAGGED";
  createdAt: string;
  updatedAt: string;
  poc: { id: string; title: string; status: string };
  user: { id: string; name: string; email: string };
};

export type CategoryItem = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

export type AnalyticsSnapshot = {
  uploadTrends: Array<{ label: string; value: number }>;
  userGrowth: Array<{ label: string; value: number }>;
  mostViewedPocs: PocListItem[];
  highestRatedPocs: PocListItem[];
  mostActiveDevelopers: Array<{
    id: string;
    name: string;
    activePocs: number;
    totalPocs: number;
  }>;
  categoryDistribution: Array<{ id: string; name: string; total: number; color?: string | null }>;
  ratingsDistribution: Array<{ rating: number; count: number }>;
  inProgressPocs: PocListItem[];
  techDistribution: Array<{ name: string; total: number }>;
};

export type PlatformSettings = {
  logoText: string;
  theme: string;
  storageProvider: string;
  emailSender: string;
  demoApprovalRequired: boolean;
  fileUploadLimitMb: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
