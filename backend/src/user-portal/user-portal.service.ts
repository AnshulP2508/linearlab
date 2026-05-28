import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { AuthUser } from '../common/auth-user';
import { sanitizeMultilineText } from '../common/sanitize';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

type UserDocument = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: string;
  team?: string | null;
  avatarUrl?: string | null;
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
  views?: number | null;
  downloads?: number | null;
  activeDemoCount?: number | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  developerId: string;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  developerWorkspace?: DeveloperWorkspace | null;
};

type FeedbackDocument = {
  _id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryDocument = {
  _id: string;
  name: string;
  color?: string | null;
};

@Injectable()
export class UserPortalService {
  constructor(private readonly mongo: MongoDatabaseService) {}

  async getMe(actor: AuthUser) {
    const user = await this.requireUser(actor);
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      team: user.team ?? null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getPocs() {
    const pocs = await (await this.pocCollection())
      .find({ status: { $ne: 'ARCHIVED' } })
      .sort({ createdAt: -1 })
      .toArray();

    const developers = await this.loadUsersByIds(pocs.map((poc) => poc.developerId));
    const categories = await this.loadCategoriesByIds(
      pocs
        .map((poc) => poc.categoryId)
        .filter((value): value is string => Boolean(value)),
    );
    const feedbackByPoc = await this.loadFeedbackForPocIds(pocs.map((poc) => poc._id));

    return {
      items: pocs.map((poc) =>
        this.toUserPocSummary(
          poc,
          developers.get(poc.developerId) ?? null,
          poc.categoryId ? (categories.get(poc.categoryId) ?? null) : null,
          feedbackByPoc.get(poc._id) ?? [],
        ),
      ),
      total: pocs.length,
      page: 1,
      pageSize: pocs.length,
    };
  }

  async getPocDetail(id: string) {
    const poc = await (await this.pocCollection()).findOne({
      _id: id,
      status: { $ne: 'ARCHIVED' },
    });
    if (!poc) {
      throw new NotFoundException('POC not found');
    }

    const [developerMap, categoryMap, feedbackByPoc] = await Promise.all([
      this.loadUsersByIds([poc.developerId]),
      this.loadCategoriesByIds(poc.categoryId ? [poc.categoryId] : []),
      this.loadFeedbackForPocIds([poc._id]),
    ]);

    const developer = developerMap.get(poc.developerId) ?? null;
    const category = poc.categoryId ? (categoryMap.get(poc.categoryId) ?? null) : null;
    const feedbacks = feedbackByPoc.get(poc._id) ?? [];

    return {
      ...this.toUserPocSummary(poc, developer, category, feedbacks),
      documents: this.buildDocuments(poc),
      demos: this.buildDemos(poc),
      feedbacks,
      developerWorkspace: poc.developerWorkspace ?? null,
      fullDescription: poc.description,
    };
  }

  async createFeedback(actor: AuthUser, body: CreateFeedbackDto) {
    const user = await this.requireUser(actor);
    const pocId = body.pocId.trim();
    const comment = sanitizeMultilineText(body.comment) ?? body.comment.trim();
    const rating = body.rating;

    if (!pocId) {
      throw new BadRequestException('POC id is required');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    const pocCollection = await this.pocCollection();
    const feedbackCollection = await this.feedbackCollection();
    const poc = await pocCollection.findOne({
      _id: pocId,
      status: { $ne: 'ARCHIVED' },
    });
    if (!poc) {
      throw new NotFoundException('POC not found');
    }

    const now = new Date();
    const feedback: FeedbackDocument = {
      _id: randomUUID(),
      pocId,
      userId: user._id,
      rating,
      comment,
      status: 'VISIBLE',
      createdAt: now,
      updatedAt: now,
    };

    await feedbackCollection.insertOne(feedback);

    const allFeedback = await feedbackCollection.find({ pocId }).toArray();
    const ratingCount = allFeedback.length;
    const ratingAverage =
      ratingCount > 0
        ? Number(
            (
              allFeedback.reduce((sum, item) => sum + item.rating, 0) / ratingCount
            ).toFixed(1),
          )
        : 0;

    await pocCollection.updateOne(
      { _id: pocId },
      {
        $set: {
          ratingCount,
          ratingAverage,
          updatedAt: now,
        },
      },
    );

    return {
      id: feedback._id,
      pocId: feedback.pocId,
      userId: feedback.userId,
      rating: feedback.rating,
      comment: feedback.comment,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  private buildDocuments(poc: PocDocument) {
    const uploadedFiles = poc.developerWorkspace?.uploadedFiles ?? [];
    if (uploadedFiles.length > 0) {
      return uploadedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        mimeType: file.mimeType ?? null,
        sizeBytes: file.sizeBytes ?? null,
        uploadedAt: file.uploadedAt,
        contentBase64: file.contentBase64 ?? null,
      }));
    }

    if (poc.documentation?.trim()) {
      return [
        {
          id: `${poc._id}-documentation`,
          name: poc.documentation.trim(),
          type: 'doc',
          mimeType: null,
          sizeBytes: null,
          uploadedAt: poc.updatedAt,
          contentBase64: null,
        },
      ];
    }

    return [];
  }

  private buildDemos(poc: PocDocument) {
    const demoUrls = poc.developerWorkspace?.demoUrls ?? {};
    const explanationVideo = poc.developerWorkspace?.explanationVideo ?? null;
    const demos = [
      demoUrls.liveDemoUrl?.trim()
        ? {
            id: `${poc._id}-live-demo`,
            label: 'Live Demo',
            type: 'url',
            value: demoUrls.liveDemoUrl.trim(),
          }
        : null,
      demoUrls.githubRepositoryUrl?.trim()
        ? {
            id: `${poc._id}-github`,
            label: 'GitHub Repository',
            type: 'url',
            value: demoUrls.githubRepositoryUrl.trim(),
          }
        : null,
      demoUrls.videoLinkUrl?.trim()
        ? {
            id: `${poc._id}-video`,
            label: 'Video Demo',
            type: 'url',
            value: demoUrls.videoLinkUrl.trim(),
          }
        : null,
      !demoUrls.liveDemoUrl?.trim() && poc.demoUrl?.trim()
        ? {
            id: `${poc._id}-fallback-demo`,
            label: 'Demo',
            type: 'url',
            value: poc.demoUrl.trim(),
          }
        : null,
      explanationVideo
        ? {
            id: explanationVideo.id,
            label:
              explanationVideo.type === 'url'
                ? 'Explanation Video'
                : 'Recorded Demo',
            type: explanationVideo.type,
            value: explanationVideo.value,
            thumbnailUrl: explanationVideo.thumbnailUrl,
            uploadedAt: explanationVideo.uploadedAt,
          }
        : null,
    ].filter(Boolean);

    return demos;
  }

  private toUserPocSummary(
    poc: PocDocument,
    developer: {
      id: string;
      name: string;
      email: string;
      team?: string | null;
      avatarUrl?: string | null;
      createdAt: Date;
    } | null,
    category: { id: string; name: string; color?: string | null } | null,
    feedbacks: Array<{
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
    }>,
  ) {
    return {
      id: poc._id,
      title: poc.title,
      slug: poc.slug,
      summary: poc.summary,
      description: poc.description,
      technologies: poc.technologies ?? [],
      category,
      developer,
      createdAt: poc.createdAt,
      updatedAt: poc.updatedAt,
      ratingAverage: poc.ratingAverage ?? 0,
      ratingCount: poc.ratingCount ?? feedbacks.length,
      feedbacks,
    };
  }

  private async loadFeedbackForPocIds(pocIds: string[]) {
    const uniquePocIds = [...new Set(pocIds.filter(Boolean))];
    const result = new Map<
      string,
      Array<{
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
      }>
    >();

    if (uniquePocIds.length === 0) {
      return result;
    }

    const feedback = await (await this.feedbackCollection())
      .find({ pocId: { $in: uniquePocIds }, status: 'VISIBLE' })
      .sort({ createdAt: -1 })
      .toArray();
    const users = await this.loadUsersByIds(feedback.map((item) => item.userId));

    for (const item of feedback) {
      const current = result.get(item.pocId) ?? [];
      current.push({
        id: item._id,
        pocId: item.pocId,
        userId: item.userId,
        rating: item.rating,
        comment: item.comment,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        user:
          users.get(item.userId) ?? {
            id: item.userId,
            name: 'Unknown User',
            email: '',
            avatarUrl: null,
          },
      });
      result.set(item.pocId, current);
    }

    return result;
  }

  private async loadUsersByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const result = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        team?: string | null;
        avatarUrl?: string | null;
        createdAt: Date;
      }
    >();

    if (uniqueIds.length === 0) {
      return result;
    }

    const users = await (await this.userCollection())
      .find({ _id: { $in: uniqueIds } })
      .toArray();

    for (const user of users) {
      result.set(user._id, {
        id: user._id,
        name: user.name,
        email: user.email,
        team: user.team ?? null,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
      });
    }

    return result;
  }

  private async loadCategoriesByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const result = new Map<string, { id: string; name: string; color?: string | null }>();

    if (uniqueIds.length === 0) {
      return result;
    }

    const categories = await (await this.categoryCollection())
      .find({ _id: { $in: uniqueIds } })
      .toArray();

    for (const category of categories) {
      result.set(category._id, {
        id: category._id,
        name: category.name,
        color: category.color ?? null,
      });
    }

    return result;
  }

  private async requireUser(actor: AuthUser) {
    if (actor.role !== Role.USER) {
      throw new NotFoundException('User not found');
    }

    const user = await (await this.userCollection()).findOne({ _id: actor.userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  private async categoryCollection() {
    const db = await this.mongo.getDb();
    return db.collection<CategoryDocument>('Category');
  }
}
