import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Filter, Sort } from 'mongodb';
import { AdminAuditService } from '../common/admin-audit.service';
import { NotificationTypes, PocStatuses } from '../common/admin-domain';
import { AuthUser } from '../common/auth-user';
import {
  sanitizeFilename,
  sanitizeMultilineText,
  sanitizePlainText,
} from '../common/sanitize';
import { SecurityMonitorService } from '../common/security-monitor.service';
import { UploadSecurityService } from '../common/upload-security.service';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { CreatePocDto } from './dto/create-poc.dto';
import {
  DocumentationSection,
  GenerateDocumentationDto,
} from './dto/generate-documentation.dto';
import { QueryPocsDto } from './dto/query-pocs.dto';
import { ReviewPocDto } from './dto/review-poc.dto';
import { UpdatePocDto } from './dto/update-poc.dto';
import { allowedTechStackByKey } from './allowed-tech-stack';

type UserDocument = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  team?: string | null;
  avatarUrl?: string | null;
};

type CategoryDocument = {
  _id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  submittedAt?: Date | null;
  assignedAt?: Date | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  adminInfo?: {
    problemStatement?: string;
    businessRequirements?: string;
    technicalRequirements?: string;
    suggestedTechStack?: string[];
    supportDocuments?: string[];
    referenceLinks?: string[];
  } | null;
  developerWorkspace?: {
    status?: string | null;
    uploadedFiles?: Array<{
      id: string;
      name: string;
      type: string;
      mimeType?: string | null;
      contentBase64?: string | null;
      sizeBytes?: number | null;
      uploadedAt: Date;
    }> | null;
    demoUrls?: {
      liveDemoUrl?: string | null;
      githubRepositoryUrl?: string | null;
      videoLinkUrl?: string | null;
    } | null;
    explanationVideo?: {
      id: string;
      type: 'file' | 'url';
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
    notes?: Array<{
      id: string;
      message: string;
      createdAt: Date;
      authorEmail: string;
    }> | null;
    submittedForReviewAt?: Date | null;
    updatedAt?: Date | null;
  } | null;
};

type FeedbackDocument = {
  _id: string;
  pocId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PocsService {
  constructor(
    private readonly mongo: MongoDatabaseService,
    private readonly auditService: AdminAuditService,
    private readonly config: ConfigService,
    private readonly uploadSecurity: UploadSecurityService,
    private readonly securityMonitor: SecurityMonitorService,
  ) {}

  async create(dto: CreatePocDto, actor: AuthUser) {
    let technologies: string[] = [];
    if (Array.isArray(dto.technologies)) {
      technologies = dto.technologies;
    } else if (typeof dto.technologies === 'string') {
      try {
        const parsed = JSON.parse(dto.technologies as string);
        technologies = Array.isArray(parsed)
          ? parsed
          : [dto.technologies as string];
      } catch {
        technologies = [dto.technologies as string];
      }
    } else if (Array.isArray(dto.techStack)) {
      technologies = dto.techStack;
    }
    technologies = this.normalizeTechnologies(technologies);

    const categoryCollection = await this.categoryCollection();
    const pocCollection = await this.pocCollection();
    const now = new Date();
    let developerId = actor.userId;
    let assignedDeveloper: UserDocument | null = null;

    if (actor.role === Role.ADMIN) {
      const assignToEmail = dto.assignToEmail?.trim().toLowerCase();
      if (!assignToEmail) {
        throw new BadRequestException('Assign To email is required');
      }

      assignedDeveloper = await (await this.userCollection()).findOne({
        email: assignToEmail,
        role: Role.DEVELOPER,
        status: 'ACTIVE',
      });

      if (!assignedDeveloper) {
        throw new BadRequestException(
          'Assign To must be an active developer email',
        );
      }

      developerId = assignedDeveloper._id;
    }

    let categoryId = dto.categoryId?.trim() || undefined;
    const fileName = sanitizeFilename(dto.file) ?? '';
    const fileSizeValue =
      dto.fileSizeBytes !== undefined ? Number(dto.fileSizeBytes) : null;
    const validatedUpload = fileName
      ? this.uploadSecurity.validateFile({
          fileName,
          mimeType: dto.fileMimeType,
          contentBase64: dto.fileContentBase64,
          sizeBytes: fileSizeValue,
        })
      : null;
    const uploadedReferenceFile = fileName
      ? {
          id: randomUUID(),
          name: validatedUpload?.fileName ?? fileName,
          type: this.detectFileType(fileName),
          mimeType:
            validatedUpload?.mimeType ?? 'application/octet-stream',
          contentBase64: validatedUpload?.contentBase64 ?? null,
          sizeBytes: validatedUpload?.sizeBytes ?? null,
          uploadedAt: now,
        }
      : null;

    if (!categoryId && dto.categoryName?.trim()) {
      const categoryName = dto.categoryName.trim();
      const existingCategory = await categoryCollection.findOne({
        name: categoryName,
      });

      if (existingCategory) {
        categoryId = existingCategory._id;
      } else {
        const category: CategoryDocument = {
          _id: randomUUID(),
          name: categoryName,
          description: null,
          color: null,
          createdAt: now,
          updatedAt: now,
        };

        try {
          await categoryCollection.insertOne(category);
          categoryId = category._id;
        } catch (error) {
          if (this.isDuplicateKeyError(error)) {
            const duplicateCategory = await categoryCollection.findOne({
              name: categoryName,
            });
            if (duplicateCategory) {
              categoryId = duplicateCategory._id;
            }
          }

          if (!categoryId) {
            throw error;
          }
        }
      }
    }

    const poc: PocDocument = {
      _id: randomUUID(),
      title: sanitizePlainText(dto.title) ?? dto.title.trim(),
      slug: await this.generateUniqueSlug(pocCollection, dto.title),
      summary: sanitizeMultilineText(dto.summary) ?? '',
      description:
        sanitizeMultilineText(dto.description) ??
        sanitizeMultilineText(dto.summary) ??
        '',
      demoUrl: null,
      documentation:
        sanitizeMultilineText(dto.documentation) ??
        sanitizeFilename(dto.file) ??
        null,
      technologies,
      status: 'PENDING_REVIEW',
      views: 0,
      downloads: 0,
      activeDemoCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      developerId,
      categoryId: categoryId ?? null,
      reviewerId: null,
      reviewNotes: null,
      rejectedReason: null,
      submittedAt: now,
      assignedAt: now,
      assignedById: actor.userId,
      assignedByName: actor.email,
      reviewedAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      adminInfo: {
        problemStatement: sanitizeMultilineText(dto.summary) ?? '',
        businessRequirements:
          sanitizeMultilineText(dto.summary) ||
          `Deliver a developer-ready proof of concept for ${dto.title.trim()} with clear handoff notes.`,
        technicalRequirements:
          sanitizeMultilineText(dto.description) ||
          sanitizeMultilineText(dto.summary) ||
          '',
        suggestedTechStack: technologies,
        supportDocuments: uploadedReferenceFile ? [uploadedReferenceFile.name] : [],
        referenceLinks: [],
      },
      developerWorkspace: uploadedReferenceFile
        ? {
            status: 'ASSIGNED',
            uploadedFiles: [uploadedReferenceFile],
            demoUrls: {},
            explanationVideo: null,
            documentationDraft: null,
            notes: [],
            submittedForReviewAt: null,
            updatedAt: now,
          }
        : undefined,
    };

    try {
      await pocCollection.insertOne(poc);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('A POC with the same title already exists');
      }
      throw error;
    }

    await this.auditService.record({
      actor,
      action: 'POC_CREATED',
      entityType: 'POC',
      entityId: poc._id,
      metadata: {
        title: poc.title,
        assignedToEmail: assignedDeveloper?.email ?? actor.email,
      },
      notification: {
        type: NotificationTypes.SYSTEM_ACTIVITY,
        title: 'New POC requested',
        message: `"${poc.title}" has been assigned to ${assignedDeveloper?.email ?? actor.email}.`,
      },
    });

    return this.hydratePoc(poc);
  }

  async findAll(query: QueryPocsDto, actor?: AuthUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const filter = await this.buildMongoFilter(query);
    if (actor?.role === Role.DEVELOPER) {
      filter.developerId = actor.userId;
    }
    const sort = this.resolveMongoSort(query.sortBy, query.sortOrder);
    const collection = await this.pocCollection();

    const [items, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: await this.hydratePocs(items),
      total,
      page,
      pageSize,
    };
  }

  async findPendingApprovals(query: QueryPocsDto) {
    return this.findAll({ ...query, status: PocStatuses[1] });
  }

  async findOne(id: string, actor?: AuthUser) {
    const collection = await this.pocCollection();
    const poc = await collection.findOne({
      _id: id,
      ...(actor?.role === Role.DEVELOPER ? { developerId: actor.userId } : {}),
    });
    if (!poc) {
      throw new NotFoundException('POC not found');
    }

    return this.hydratePocDetail(poc);
  }

  async generateDocumentation(
    id: string,
    dto: GenerateDocumentationDto,
    actor?: AuthUser,
  ) {
    const collection = await this.pocCollection();
    const poc = await collection.findOne({
      _id: id,
      ...(actor?.role === Role.DEVELOPER ? { developerId: actor.userId } : {}),
    });
    if (!poc) {
      throw new NotFoundException('POC not found');
    }

    const apiKey =
      this.config.get<string>('GOOGLE_API_KEY')?.trim() ||
      this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'Missing GOOGLE_API_KEY or GEMINI_API_KEY in backend environment configuration',
      );
    }

    const modelCandidates = [
      this.config.get<string>('GEMINI_DOCUMENTATION_MODEL')?.trim(),
      ...this.parseModelList(
        this.config.get<string>('GEMINI_DOCUMENTATION_FALLBACK_MODELS'),
      ),
      'gemini-2.5-flash',
    ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);
    this.securityMonitor.recordAiUsage(actor?.userId ?? 'unknown', dto.section);
    const prompt = this.buildDocumentationPrompt(poc, dto.section, dto.prompt);
    const { body, model } = await this.generateDocumentationWithRetry(
      apiKey,
      modelCandidates,
      prompt,
    );

    const text = body.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n\n');

    if (!text) {
      throw new BadRequestException('Gemini returned an empty response');
    }

    const cleanedText = this.sanitizeGeneratedDocumentation(text);

    const wasTruncated = body.candidates?.some(
      (candidate) => candidate.finishReason === 'MAX_TOKENS',
    );

    return {
      section: dto.section,
      content: cleanedText,
      model,
      truncated: Boolean(wasTruncated),
    };
  }

  async update(id: string, dto: UpdatePocDto, actor: AuthUser) {
    const collection = await this.pocCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    const updatePayload: Partial<PocDocument> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      updatePayload.title = sanitizePlainText(title) ?? title;
      updatePayload.slug = await this.generateUniqueSlug(collection, title, id);
    }
    if (dto.summary !== undefined) {
      updatePayload.summary = sanitizeMultilineText(dto.summary) ?? '';
    }
    if (dto.description !== undefined)
      updatePayload.description = sanitizeMultilineText(dto.description) ?? '';
    if (dto.demoUrl !== undefined) updatePayload.demoUrl = dto.demoUrl;
    if (dto.documentation !== undefined) {
      updatePayload.documentation =
        sanitizeMultilineText(dto.documentation) ?? null;
    }
    if (dto.technologies !== undefined) {
      updatePayload.technologies = this.normalizeTechnologies(dto.technologies);
    }
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.categoryId !== undefined) {
      updatePayload.categoryId = dto.categoryId || null;
    }
    if (dto.developerId !== undefined) {
      updatePayload.developerId = dto.developerId;
    }


      if (updatePayload.title || updatePayload.slug) {
        const duplicate = await collection.findOne({
          slug: updatePayload.slug,
          _id: { $ne: id } as never,
        });
        if (duplicate) {
          throw new ConflictException('A POC with the same title already exists');
        }
      }

      await collection.updateOne({ _id: id }, { $set: updatePayload });
      const updated = await collection.findOne({ _id: id });
      if (!updated) {
        throw new NotFoundException('POC not found');
      }

      await this.auditService.record({
        actor,
        action: 'POC_UPDATED',
        entityType: 'POC',
        entityId: updated._id,
        metadata: {
          before: {
          title: existing.title,
          status: existing.status,
          categoryId: existing.categoryId ?? null,
          developerId: existing.developerId ?? null,
        },
        after: {
          title: updated.title,
          status: updated.status,
          categoryId: updated.categoryId ?? null,
          developerId: updated.developerId ?? null,
        },
      },
      notification: {
        type: NotificationTypes.SYSTEM_ACTIVITY,
        title: 'POC updated',
        message: `${updated.title} details were updated.`,
      },
    });

    return this.hydratePoc(updated);
  }

  async approve(id: string, dto: ReviewPocDto, actor: AuthUser) {
    const collection = await this.pocCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    const now = new Date();
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          status: 'PUBLISHED',
          reviewNotes: dto.notes,
          rejectedReason: null,
          reviewerId: actor.userId,
          reviewedAt: now,
          publishedAt: now,
          updatedAt: now,
        },
      },
    );

    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('POC not found');
    }

    await this.auditService.record({
      actor,
      action: 'POC_APPROVED',
      entityType: 'POC',
      entityId: updated._id,
      metadata: {
        previousStatus: existing.status,
        notes: dto.notes,
      },
      notification: {
        type: NotificationTypes.POC_APPROVED,
        title: 'POC approved',
        message: `${updated.title} is now published.`,
      },
    });

    return this.hydratePoc(updated);
  }

  async reject(id: string, dto: ReviewPocDto, actor: AuthUser) {
    const collection = await this.pocCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    const now = new Date();
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          status: 'REJECTED',
          reviewNotes: dto.notes,
          rejectedReason: dto.reason,
          reviewerId: actor.userId,
          reviewedAt: now,
          publishedAt: null,
          updatedAt: now,
        },
      },
    );

    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('POC not found');
    }

    await this.auditService.record({
      actor,
      action: 'POC_REJECTED',
      entityType: 'POC',
      entityId: updated._id,
      metadata: {
        previousStatus: existing.status,
        notes: dto.notes,
        reason: dto.reason,
      },
      notification: {
        type: NotificationTypes.POC_REJECTED,
        title: 'POC rejected',
        message: `${updated.title} was sent back for revisions.`,
      },
    });

    return this.hydratePoc(updated);
  }

  async keepPending(id: string, dto: ReviewPocDto, actor: AuthUser) {
    const collection = await this.pocCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    const now = new Date();
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          status: 'PENDING_REVIEW',
          reviewNotes: dto.notes ?? existing.reviewNotes ?? null,
          rejectedReason: null,
          reviewerId: actor.userId,
          reviewedAt: now,
          publishedAt: null,
          updatedAt: now,
        },
      },
    );

    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('POC not found');
    }

    await this.auditService.record({
      actor,
      action: 'POC_PENDING',
      entityType: 'POC',
      entityId: updated._id,
      metadata: {
        previousStatus: existing.status,
        notes: dto.notes ?? null,
      },
      notification: {
        type: NotificationTypes.SYSTEM_ACTIVITY,
        title: 'POC kept pending',
        message: `${updated.title} remains in pending review.`,
      },
    });

    return this.hydratePoc(updated);
  }

  async archive(id: string, actor: AuthUser) {
    const collection = await this.pocCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    await collection.updateOne(
      { _id: id },
      { $set: { status: 'ARCHIVED', updatedAt: new Date() } },
    );

    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('POC not found');
    }

    await this.auditService.record({
      actor,
      action: 'POC_ARCHIVED',
      entityType: 'POC',
      entityId: updated._id,
      metadata: { previousStatus: existing.status },
      notification: {
        type: NotificationTypes.SYSTEM_ACTIVITY,
        title: 'POC archived',
        message: `${updated.title} was archived.`,
      },
    });

    return this.hydratePoc(updated);
  }

  async remove(id: string, actor: AuthUser) {
    const pocCollection = await this.pocCollection();
    const feedbackCollection = await this.feedbackCollection();
    const existing = await pocCollection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('POC not found');
    }

    await feedbackCollection.deleteMany({ pocId: id });
    await pocCollection.deleteOne({ _id: id });

    await this.auditService.record({
      actor,
      action: 'POC_DELETED',
      entityType: 'POC',
      entityId: id,
      metadata: { title: existing.title },
      notification: {
        type: NotificationTypes.SYSTEM_ACTIVITY,
        title: 'POC deleted',
        message: `${existing.title} was deleted.`,
      },
    });

    return { ok: true };
  }

  private async buildMongoFilter(
    query: QueryPocsDto,
  ): Promise<Filter<PocDocument>> {
    const filter: Filter<PocDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.developerId) {
      filter.developerId = query.developerId;
    }

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      const users = await this.userCollection();
      const matchingDevelopers = await users
        .find({ name: searchRegex }, { projection: { _id: 1 } })
        .toArray();
      const developerIds = matchingDevelopers.map((user) => user._id);

      filter.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { technologies: searchRegex as never },
        ...(developerIds.length > 0
          ? [{ developerId: { $in: developerIds } as never }]
          : []),
      ];
    }

    return filter;
  }

  private resolveMongoSort(
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Sort {
    const allowed = new Set([
      'title',
      'status',
      'views',
      'downloads',
      'ratingAverage',
      'createdAt',
      'updatedAt',
      'publishedAt',
    ]);
    const field = allowed.has(sortBy) ? sortBy : 'createdAt';
    return [[field, sortOrder === 'asc' ? 1 : -1]];
  }

  private async hydratePocs(pocs: PocDocument[]) {
    const developers = await this.loadUsersByIds(
      pocs.map((poc) => poc.developerId).filter(Boolean),
    );
    const categories = await this.loadCategoriesByIds(
      pocs
        .map((poc) => poc.categoryId)
        .filter((value): value is string => Boolean(value)),
    );

    return pocs.map((poc) => this.toPocEntity(poc, developers, categories));
  }

  private async hydratePoc(poc: PocDocument) {
    const developers = await this.loadUsersByIds([poc.developerId]);
    const categories = await this.loadCategoriesByIds(
      poc.categoryId ? [poc.categoryId] : [],
    );
    return this.toPocEntity(poc, developers, categories);
  }

  private async hydratePocDetail(poc: PocDocument) {
    const developers = await this.loadUsersByIds([poc.developerId]);
    const reviewers = await this.loadUsersByIds(
      poc.reviewerId ? [poc.reviewerId] : [],
    );
    const categories = await this.loadCategoriesByIds(
      poc.categoryId ? [poc.categoryId] : [],
    );
    const feedback = await this.loadFeedbackForPoc(poc._id);

      return {
        ...this.toPocEntity(poc, developers, categories),
        reviewer: poc.reviewerId ? (reviewers.get(poc.reviewerId) ?? null) : null,
        developerWorkspace: {
          uploadedFiles: poc.developerWorkspace?.uploadedFiles ?? [],
          demoUrls: poc.developerWorkspace?.demoUrls ?? {
            liveDemoUrl: poc.demoUrl ?? null,
          },
          explanationVideo: poc.developerWorkspace?.explanationVideo ?? null,
          documentationDraft: poc.developerWorkspace?.documentationDraft ?? null,
        },
        feedback,
      };
  }

  private buildDocumentationPrompt(
    poc: PocDocument,
    section: DocumentationSection,
    rawPrompt: string,
  ) {
    const sectionGuidance: Record<DocumentationSection, string> = {
      purpose: [
        'Explain the purpose of the POC clearly in simple language.',
        'Cover the main objective, intended users, business value, expected outcome, and why this POC was created.',
        'Keep the explanation concise while still making the section feel complete.',
        'Keep it professional and understandable for both technical and non-technical readers.',
      ].join(' '),
      problemItSolves: [
        'Explain the problem this POC solves in simple and clear language.',
        'Cover the current pain points, who is affected, why the problem matters, what happens without a solution, and the impact of solving it.',
        'Keep the explanation practical and relatable without becoming lengthy.',
        'Keep it professional and easy to understand.',
      ].join(' '),
      howToUseIt: [
        'Explain how to use the POC in a practical step-by-step way using simple language.',
        'Cover prerequisites, setup or access expectations, primary workflow steps, expected user actions, and useful usage tips.',
        'Keep the steps short, actionable, and easy for first-time users to follow.',
        'Only add supporting detail where it improves clarity.',
      ].join(' '),
    };

    return [
      'You are writing polished documentation for a proof-of-concept project.',
      `Documentation section: ${section}.`,
      sectionGuidance[section],
      'Use the user prompt as the main instruction and turn it into a complete, well-structured response.',
      'Write in simple English that is easy to understand.',
      'Keep the response slightly shorter than a typical detailed explanation, but do not leave out any important point.',
      'Prefer 1 to 3 short paragraphs with direct sentences.',
      'Avoid repetition, filler, and unnecessary background context.',
      'Make every sentence add useful information.',
      'Avoid overly technical jargon unless necessary.',
      'Return only the final documentation text as clean plain text.',
      'Do not use Markdown symbols such as ##, **, *, -, or numbered list formatting.',
      'Do not add any title, heading, section name, or label such as Purpose, Problem It Solves, or How To Use It.',
      'Start directly with the actual response content.',
      'If you need to separate ideas, do it with clear sentences and spacing instead of bullet syntax.',
      'Keep the writing natural, human, and not robotic.',
      'Do not mention that you are an AI model.',
      '',
      'POC context:',
      `Title: ${poc.title}`,
      `Summary: ${poc.summary || 'N/A'}`,
      `Description: ${poc.description || 'N/A'}`,
      `Technologies: ${poc.technologies?.join(', ') || 'N/A'}`,
      `Current documentation reference: ${poc.documentation || 'N/A'}`,
      '',
      'User raw prompt:',
      rawPrompt.trim(),
    ].join('\n');
  }

  private sanitizeGeneratedDocumentation(text: string) {
    const cleaned = text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^\s*[-*+]\s+\*\*(.+?)\*\*:\s*/gm, '$1: ')
      .replace(/^\s*[-*+]\s+\*\*(.+?)\*\*\s*/gm, '$1: ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned.replace(
      /^(purpose|problem it solves|how to use it|how to use)\s*:?\s*\n*/i,
      '',
    ).trim();
  }

  private async generateDocumentationWithRetry(
    apiKey: string,
    modelCandidates: string[],
    prompt: string,
  ) {
    const maxAttemptsPerModel = 3;
    let lastErrorMessage = 'Failed to generate documentation content';

    for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 4096,
              },
            }),
          },
        );

        const body = (await response.json()) as {
          error?: { message?: string };
          candidates?: Array<{
            finishReason?: string;
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };

        if (response.ok) {
          return { body, model };
        }

        lastErrorMessage =
          body.error?.message ?? 'Failed to generate documentation content';

        if (
          this.isRetryableGenerationError(response.status, lastErrorMessage) &&
          attempt < maxAttemptsPerModel
        ) {
          await this.delay(600 * attempt);
          continue;
        }

        if (this.isRetryableGenerationError(response.status, lastErrorMessage)) {
          break;
        }

        throw new BadRequestException(lastErrorMessage);
      }
    }

    throw new ServiceUnavailableException(
      `Documentation generation is temporarily unavailable. ${lastErrorMessage}`,
    );
  }

  private isRetryableGenerationError(status: number, message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      status === 429 ||
      status >= 500 ||
      normalizedMessage.includes('high demand') ||
      normalizedMessage.includes('try again later') ||
      normalizedMessage.includes('temporarily unavailable') ||
      normalizedMessage.includes('overloaded') ||
      normalizedMessage.includes('rate limit')
    );
  }

  private parseModelList(value?: string | null) {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async loadFeedbackForPoc(pocId: string) {
    const feedbackCollection = await this.feedbackCollection();
    const feedback = await feedbackCollection
      .find({ pocId })
      .sort({ createdAt: -1 })
      .toArray();
    const users = await this.loadUsersByIds(
      feedback.map((item) => item.userId),
    );

    return feedback.map((item) => ({
      id: item._id,
      pocId: item.pocId,
      userId: item.userId,
      rating: item.rating,
      comment: item.comment,
      type: item.type ?? 'USER_FEEDBACK',
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      poc: { id: pocId, title: '', status: '' },
      user: users.get(item.userId) ?? {
        id: item.userId,
        name: 'Unknown',
        email: '',
      },
    }));
  }

  private async loadUsersByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return new Map<
        string,
        {
          id: string;
          name: string;
          email: string;
          team?: string | null;
          avatarUrl?: string | null;
        }
      >();
    }

    const users = await (await this.userCollection())
      .find({ _id: { $in: uniqueIds } })
      .toArray();

    return new Map(
      users.map((user) => [
        user._id,
        {
          id: user._id,
          name: user.name,
          email: user.email,
          team: user.team ?? null,
          avatarUrl: user.avatarUrl ?? null,
        },
      ]),
    );
  }

  private async loadCategoriesByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return new Map<
        string,
        { id: string; name: string; color?: string | null }
      >();
    }

    const categories = await (await this.categoryCollection())
      .find({ _id: { $in: uniqueIds } })
      .toArray();

    return new Map(
      categories.map((category) => [
        category._id,
        {
          id: category._id,
          name: category.name,
          color: category.color ?? null,
        },
      ]),
    );
  }

  private toPocEntity(
    poc: PocDocument,
    developers = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        team?: string | null;
        avatarUrl?: string | null;
      }
    >(),
    categories = new Map<
      string,
      { id: string; name: string; color?: string | null }
    >(),
  ) {
    return {
      id: poc._id,
      title: poc.title,
      slug: poc.slug,
      summary: poc.summary,
      description: poc.description,
      demoUrl: poc.demoUrl ?? null,
      documentation: poc.documentation ?? null,
      technologies: poc.technologies ?? [],
      status: poc.status,
      views: poc.views ?? 0,
      downloads: poc.downloads ?? 0,
      activeDemoCount: poc.activeDemoCount ?? 0,
      ratingAverage: poc.ratingAverage ?? 0,
      ratingCount: poc.ratingCount ?? 0,
      developerId: poc.developerId,
      categoryId: poc.categoryId ?? null,
      reviewerId: poc.reviewerId ?? null,
      reviewNotes: poc.reviewNotes ?? null,
      rejectedReason: poc.rejectedReason ?? null,
      submittedAt: poc.submittedAt ?? null,
      reviewedAt: poc.reviewedAt ?? null,
      publishedAt: poc.publishedAt ?? null,
      createdAt: poc.createdAt,
      updatedAt: poc.updatedAt,
      developer: developers.get(poc.developerId),
      category: poc.categoryId
        ? (categories.get(poc.categoryId) ?? null)
        : null,
    };
  }

  private async generateUniqueSlug(
    pocCollection: {
      findOne: (filter: Filter<PocDocument>) => Promise<PocDocument | null>;
    },
    title: string,
    excludeId?: string,
  ) {
    const baseSlug =
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'poc';

    let slug = baseSlug;
    let counter = 2;

    while (
      await pocCollection.findOne({
        slug,
        ...(excludeId ? { _id: { $ne: excludeId } as never } : {}),
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private detectFileType(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'svg'].includes(ext)) return 'diagram';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'zip') return 'zip';
    return ext || 'file';
  }

  private normalizeTechnologies(technologies: string[]) {
    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const technology of technologies) {
      const key = technology.trim().toLowerCase();
      if (!key || seen.has(key)) continue;

      const canonical = allowedTechStackByKey.get(key);
      if (!canonical) {
        throw new BadRequestException(
          `Unsupported technology "${technology}". Select a valid frontend or backend language/technology.`,
        );
      }

      seen.add(key);
      normalized.push(canonical);
    }

    return normalized;
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    );
  }

  private async userCollection() {
    const db = await this.mongo.getDb();
    return db.collection<UserDocument>('User');
  }

  private async categoryCollection() {
    const db = await this.mongo.getDb();
    return db.collection<CategoryDocument>('Category');
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
