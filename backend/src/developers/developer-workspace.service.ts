import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Filter } from 'mongodb';
import { AuthUser } from '../common/auth-user';
import {
  assertStrongPassword,
  MIN_BCRYPT_ROUNDS,
} from '../common/password-policy';
import {
  sanitizeFilename,
  sanitizeMultilineText,
  sanitizePlainText,
} from '../common/sanitize';
import { UploadSecurityService } from '../common/upload-security.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { MongoDatabaseService } from '../mongo/mongo-database.service';

type DeveloperStage =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'DEVELOPMENT_COMPLETED'
  | 'UNDER_ADMIN_REVIEW'
  | 'PUBLISHED';

type FeedbackKind =
  | 'USER_FEEDBACK'
  | 'ADMIN_COMMENT'
  | 'BUG_REPORT'
  | 'IMPROVEMENT_SUGGESTION';

type UserDocument = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: string;
  team?: string | null;
  avatarUrl?: string | null;
  skills?: string[];
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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

type PocAdminBrief = {
  problemStatement: string;
  businessRequirements: string;
  technicalRequirements: string;
  suggestedTechStack: string[];
  supportDocuments: string[];
  referenceLinks: string[];
};

type PocDocument = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  demoUrl?: string | null;
  documentation?: string | null;
  technologies: string[];
  status: string;
  developerId: string;
  categoryId?: string | null;
  reviewerId?: string | null;
  reviewNotes?: string | null;
  rejectedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
  submittedAt?: Date | null;
  deadline?: Date | null;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedAt?: Date | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  adminInfo?: PocAdminBrief;
  developerWorkspace?: DeveloperWorkspace;
};

type FeedbackDocument = {
  _id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  type?: FeedbackKind;
  createdAt: Date;
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

const STAGES: DeveloperStage[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'DEVELOPMENT_COMPLETED',
  'UNDER_ADMIN_REVIEW',
  'PUBLISHED',
];

@Injectable()
export class DeveloperWorkspaceService {
  constructor(
    private readonly mongo: MongoDatabaseService,
    private readonly config: ConfigService,
    private readonly uploadSecurity: UploadSecurityService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async getMe(actor: AuthUser) {
    const user = await this.requireDeveloper(actor);
    const pocs = await (await this.pocCollection())
      .find({ developerId: user._id })
      .toArray();

    const statuses = pocs.map((poc) => this.resolveStage(poc));
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      skills: user.skills ?? [],
      team: user.team ?? 'POC Delivery',
      stats: {
        totalAssignedPocs: pocs.length,
        inProgress: statuses.filter((status) => status === 'IN_PROGRESS')
          .length,
        completed: statuses.filter(
          (status) =>
            status === 'DEVELOPMENT_COMPLETED' || status === 'PUBLISHED',
        ).length,
        underReview: statuses.filter(
          (status) => status === 'UNDER_ADMIN_REVIEW',
        ).length,
      },
    };
  }

  async getAssignedPocs(
    actor: AuthUser,
    query: {
      status?: string;
      priority?: string;
      deadline?: string;
      search?: string;
    },
  ) {
    const user = await this.requireDeveloper(actor);

    const filter: Filter<PocDocument> = { developerId: user._id };
    if (query.search) {
      const regex = new RegExp(
        query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = [
        { title: regex },
        { summary: regex },
        { description: regex },
      ];
    }

    const pocs = await (await this.pocCollection())
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    return pocs
      .map((poc) => this.toDeveloperPocSummary(poc))
      .filter((poc) => {
        if (
          query.status &&
          query.status !== 'ALL' &&
          poc.stage !== query.status
        ) {
          return false;
        }
        if (
          query.priority &&
          query.priority !== 'ALL' &&
          poc.priority !== query.priority
        ) {
          return false;
        }
        if (query.deadline && query.deadline !== 'ALL') {
          const deadline = new Date(poc.deadline).getTime();
          const now = Date.now();
          const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          if (query.deadline === 'THIS_WEEK' && diffDays > 7) return false;
          if (query.deadline === 'OVERDUE' && diffDays >= 0) return false;
          if (query.deadline === 'THIS_MONTH' && diffDays > 30) return false;
        }
        return true;
      });
  }

  async getPocDetail(actor: AuthUser, pocId: string) {
    const user = await this.requireDeveloper(actor);
    const poc = await this.requireOwnedPoc(user._id, pocId);
    const feedback = await this.getFeedbackForPoc(poc._id);

    return {
      ...this.toDeveloperPocSummary(poc),
      adminInfo: this.buildAdminInfo(poc),
      developerWorkspace: this.buildDeveloperWorkspace(poc),
      feedback,
    };
  }

  async updatePoc(actor: AuthUser, pocId: string, dto: DeveloperPocUpdateDto) {
    const user = await this.requireDeveloper(actor);
    const poc = await this.requireOwnedPoc(user._id, pocId);
    const workspace = this.buildDeveloperWorkspace(poc);
    const now = new Date();

    if (Array.isArray(dto.addFiles) && dto.addFiles.length > 0) {
      const existingFileNames = new Set(
        workspace.uploadedFiles.map((file) => file.name.trim().toLowerCase()),
      );
      const incomingFiles = dto.addFiles.map((file) => {
        const validated = this.uploadSecurity.validateFile({
          fileName: file.name,
          mimeType: file.mimeType,
          contentBase64: file.contentBase64,
          sizeBytes: file.sizeBytes,
        });
        return {
          file,
          name: validated?.fileName ?? file.name.trim(),
          validated,
        };
      });
      const seenIncomingNames = new Set<string>();
      const duplicateIncomingFile = incomingFiles.find(({ name }) => {
        const normalizedName = name.toLowerCase();
        if (seenIncomingNames.has(normalizedName)) {
          return true;
        }
        seenIncomingNames.add(normalizedName);
        return false;
      });

      if (duplicateIncomingFile) {
        throw new BadRequestException(
          `A file named "${duplicateIncomingFile.name}" was added more than once`,
        );
      }

      const duplicateFile = incomingFiles.find(({ name }) =>
        existingFileNames.has(name.toLowerCase()),
      );

      if (duplicateFile) {
        throw new BadRequestException(
          `A file named "${duplicateFile.name}" has already been uploaded for this POC`,
        );
      }

      workspace.uploadedFiles = [
        ...workspace.uploadedFiles,
        ...incomingFiles.map(({ name, validated }) => {
          return {
            id: randomUUID(),
            name,
            type: this.detectFileType(name),
            mimeType: validated?.mimeType ?? null,
            contentBase64: validated?.contentBase64 ?? null,
            sizeBytes: validated?.sizeBytes ?? null,
            uploadedAt: now,
          };
        }),
      ];
    }

    if (dto.deleteFileId) {
      workspace.uploadedFiles = workspace.uploadedFiles.filter(
        (file) => file.id !== dto.deleteFileId,
      );
    }

    if (dto.demoUrls) {
      workspace.demoUrls = {
        ...workspace.demoUrls,
        ...dto.demoUrls,
        liveDemoUrl: dto.demoUrls.liveDemoUrl?.trim() || workspace.demoUrls.liveDemoUrl,
        githubRepositoryUrl:
          dto.demoUrls.githubRepositoryUrl?.trim() ||
          workspace.demoUrls.githubRepositoryUrl,
        videoLinkUrl:
          dto.demoUrls.videoLinkUrl?.trim() || workspace.demoUrls.videoLinkUrl,
      };
    }

    if (dto.explanationVideoFileName?.trim()) {
      workspace.explanationVideo = {
        id: randomUUID(),
        type: 'file',
        value:
          sanitizeFilename(dto.explanationVideoFileName) ??
          dto.explanationVideoFileName.trim(),
        thumbnailUrl: '',
        uploadedAt: now,
      };
    }

    if (dto.documentationDraft) {
      workspace.documentationDraft = {
        ...(workspace.documentationDraft ?? {}),
        purpose:
          sanitizeMultilineText(dto.documentationDraft.purpose) ??
          workspace.documentationDraft?.purpose ??
          null,
        problemItSolves:
          sanitizeMultilineText(dto.documentationDraft.problemItSolves) ??
          workspace.documentationDraft?.problemItSolves ??
          null,
        howToUseIt:
          sanitizeMultilineText(dto.documentationDraft.howToUseIt) ??
          workspace.documentationDraft?.howToUseIt ??
          null,
        techStack:
          sanitizeMultilineText(dto.documentationDraft.techStack) ??
          workspace.documentationDraft?.techStack ??
          null,
        teamBehindIt:
          sanitizeMultilineText(dto.documentationDraft.teamBehindIt) ??
          workspace.documentationDraft?.teamBehindIt ??
          null,
      };
    }

    if (dto.note?.trim()) {
      workspace.notes = [
        {
          id: randomUUID(),
          message: sanitizeMultilineText(dto.note) ?? dto.note.trim(),
          createdAt: now,
          authorEmail: actor.email,
        },
        ...workspace.notes,
      ];
    }

    if (dto.status) {
      this.assertForwardOnlyStatus(workspace.status, dto.status);
      if (dto.status === 'UNDER_ADMIN_REVIEW' || dto.status === 'PUBLISHED') {
        throw new BadRequestException(
          'Use review submission or admin approval',
        );
      }
      workspace.status = dto.status;
    }

    const updatePayload: Partial<PocDocument> = {
      developerWorkspace: {
        ...workspace,
        updatedAt: now,
      },
      updatedAt: now,
    };

    if (dto.submitForReview) {
      if (workspace.status !== 'DEVELOPMENT_COMPLETED') {
        throw new BadRequestException(
          'POC must be marked as Development Completed before review submission',
        );
      }
      updatePayload.status = 'PENDING_REVIEW';
      updatePayload.developerWorkspace = {
        ...workspace,
        status: 'UNDER_ADMIN_REVIEW',
        submittedForReviewAt: now,
        updatedAt: now,
      };
    }

    await (
      await this.pocCollection()
    ).updateOne({ _id: pocId, developerId: user._id }, { $set: updatePayload });

    return this.getPocDetail(actor, pocId);
  }

  async getFeedback(actor: AuthUser, query: { type?: string; pocId?: string }) {
    const user = await this.requireDeveloper(actor);
    const pocs = await (await this.pocCollection())
      .find({ developerId: user._id })
      .toArray();

    const feedbackGroups = await Promise.all(
      pocs.map(async (poc) => this.getFeedbackForPoc(poc._id)),
    );

    return feedbackGroups
      .flat()
      .filter((item) => {
        if (query.type && query.type !== 'ALL' && item.type !== query.type) {
          return false;
        }
        if (query.pocId && item.pocId !== query.pocId) {
          return false;
        }
        return true;
      })
      .sort((left, right) => {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      });
  }

  async updateProfile(actor: AuthUser, dto: DeveloperProfileUpdateDto) {
    const user = await this.requireDeveloper(actor);
    const updatePayload: Partial<UserDocument> = {
      updatedAt: new Date(),
    };

    if (dto.name?.trim()) {
      updatePayload.name = sanitizePlainText(dto.name) ?? dto.name.trim();
    }
    if (dto.avatarUrl !== undefined)
      updatePayload.avatarUrl = dto.avatarUrl.trim();
    if (dto.skills) {
      updatePayload.skills = dto.skills
        .map((skill) => sanitizePlainText(skill) ?? skill.trim())
        .filter(Boolean);
    }

    await (
      await this.userCollection()
    ).updateOne({ _id: user._id }, { $set: updatePayload });

    return this.getMe(actor);
  }

  async changePassword(actor: AuthUser, dto: DeveloperPasswordChangeDto) {
    const user = await this.requireDeveloper(actor);
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) {
      throw new BadRequestException('Current password is incorrect');
    }
    assertStrongPassword(dto.newPassword, 'New password');
    const rounds = Math.max(
      Number(this.config.get('BCRYPT_ROUNDS') ?? MIN_BCRYPT_ROUNDS),
      MIN_BCRYPT_ROUNDS,
    );
    const password = await bcrypt.hash(dto.newPassword, rounds);
    await (
      await this.userCollection()
    ).updateOne(
      { _id: user._id },
      { $set: { password, updatedAt: new Date() } },
    );
    await this.authSessions.revokeAllForUser(user._id);

    return { ok: true };
  }

  private shouldHideFromDeveloperFeedback(
    item: { _id: string; comment: string },
    poc?: Pick<PocDocument, 'reviewNotes' | 'rejectedReason'> | null,
  ) {
    if (
      item._id.endsWith('-admin-comment') ||
      item._id.endsWith('-bug-report')
    ) {
      return true;
    }

    const comment = item.comment.trim();
    if (!comment || !poc) {
      return false;
    }

    return (
      comment === (poc.reviewNotes?.trim() ?? '') ||
      comment === (poc.rejectedReason?.trim() ?? '')
    );
  }

  private async getFeedbackForPoc(pocId: string) {
    const poc = await (await this.pocCollection()).findOne({ _id: pocId });
    const feedbackDocs = await (await this.feedbackCollection())
      .find({ pocId })
      .sort({ createdAt: -1 })
      .toArray();
    const users = await this.loadUsersByIds(
      feedbackDocs.map((item) => item.userId),
    );

    return feedbackDocs
      .filter((item) => !this.shouldHideFromDeveloperFeedback(item, poc))
      .map((item) => ({
        id: item._id,
        pocId: item.pocId,
        rating: item.rating,
        comment: item.comment,
        type: item.type ?? 'USER_FEEDBACK',
        status: item.status,
        user: users.get(item.userId) ?? {
          id: item.userId,
          name: 'Unknown User',
        },
        createdAt: item.createdAt.toISOString(),
      }));
  }

  private toDeveloperPocSummary(poc: PocDocument) {
    const workspace = this.buildDeveloperWorkspace(poc);
    return {
      id: poc._id,
      title: poc.title,
      slug: poc.slug,
      assignedBy: poc.assignedByName ?? 'Admin Control',
      assignedDate: (poc.assignedAt ?? poc.createdAt).toISOString(),
      deadline: (
        poc.deadline ?? this.defaultDeadline(poc.createdAt)
      ).toISOString(),
      priority: poc.priority ?? 'MEDIUM',
      stage: this.resolveStage(poc),
      summary: poc.summary,
      description: poc.description,
      technologies: poc.technologies ?? [],
      documentationCount: workspace.uploadedFiles.length,
      demoUrls: workspace.demoUrls,
      hasExplanationVideo: Boolean(workspace.explanationVideo),
    };
  }

  private buildAdminInfo(poc: PocDocument) {
    const info = poc.adminInfo;
    return {
      problemStatement:
        info?.problemStatement ??
        poc.summary ??
        'Business problem pending elaboration.',
      businessRequirements:
        info?.businessRequirements ??
        `Deliver a developer-ready proof of concept for ${poc.title} with clear handoff notes.`,
      technicalRequirements:
        info?.technicalRequirements ??
        poc.description ??
        'Build the requested workflow and provide implementation evidence.',
      suggestedTechStack: info?.suggestedTechStack ?? poc.technologies ?? [],
      supportDocuments:
        info?.supportDocuments ??
        (poc.documentation ? [poc.documentation] : ['Briefing document.pdf']),
      referenceLinks: info?.referenceLinks ?? [],
      deadline: (
        poc.deadline ?? this.defaultDeadline(poc.createdAt)
      ).toISOString(),
    };
  }

  private buildDeveloperWorkspace(poc: PocDocument): DeveloperWorkspace {
    if (poc.developerWorkspace) {
      return {
        ...poc.developerWorkspace,
        uploadedFiles: poc.developerWorkspace.uploadedFiles ?? [],
        demoUrls: poc.developerWorkspace.demoUrls ?? {},
        documentationDraft: poc.developerWorkspace.documentationDraft ?? {},
        notes: poc.developerWorkspace.notes ?? [],
        updatedAt: poc.developerWorkspace.updatedAt ?? poc.updatedAt,
      };
    }

    return {
      status: poc.status === 'PUBLISHED' ? 'PUBLISHED' : 'ASSIGNED',
      uploadedFiles: [],
      demoUrls: poc.demoUrl ? { liveDemoUrl: poc.demoUrl } : {},
      explanationVideo: null,
      documentationDraft: {},
      notes: [],
      submittedForReviewAt: null,
      updatedAt: poc.updatedAt,
    };
  }

  private resolveStage(poc: PocDocument): DeveloperStage {
    if (poc.status === 'PUBLISHED') return 'PUBLISHED';
    return this.buildDeveloperWorkspace(poc).status;
  }

  private assertForwardOnlyStatus(
    current: DeveloperStage,
    next: DeveloperStage,
  ) {
    const currentIndex = STAGES.indexOf(current);
    const nextIndex = STAGES.indexOf(next);
    if (nextIndex === -1) {
      throw new BadRequestException('Invalid status transition');
    }
    if (nextIndex <= currentIndex) {
      throw new BadRequestException('Status can only move forward');
    }
    if (nextIndex - currentIndex > 1) {
      throw new BadRequestException('Move status one step at a time');
    }
  }

  private async requireDeveloper(actor: AuthUser) {
    if (actor.role !== Role.DEVELOPER) {
      throw new ForbiddenException('Developer access only');
    }
    const user = await (
      await this.userCollection()
    ).findOne({ _id: actor.userId });
    if (!user) {
      throw new NotFoundException('Developer not found');
    }
    return user;
  }

  private async requireOwnedPoc(developerId: string, pocId: string) {
    const poc = await (
      await this.pocCollection()
    ).findOne({
      _id: pocId,
      developerId,
    });
    if (!poc) {
      throw new NotFoundException('Assigned POC not found');
    }
    return poc;
  }

  private async loadUsersByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return new Map<string, { id: string; name: string }>();
    }

    const users = await (await this.userCollection())
      .find({ _id: { $in: uniqueIds } })
      .toArray();

    return new Map(
      users.map((user) => [user._id, { id: user._id, name: user.name }]),
    );
  }

  private defaultDeadline(createdAt: Date) {
    return new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);
  }

  private detectFileType(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'svg'].includes(ext)) return 'diagram';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'zip') return 'zip';
    return ext || 'file';
  }

  private buildVideoThumbnail(url: string) {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i,
    );
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return '';
  }

  private async userCollection() {
    const db = await this.mongo.getDb();
    return db.collection<UserDocument>('User');
  }

  private async pocCollection() {
    const db = await this.mongo.getDb();
    return db.collection<PocDocument>('POC');
  }

  private async feedbackCollection() {
    const db = await this.mongo.getDb();
    return db.collection<FeedbackDocument>('Feedback');
  }
}
