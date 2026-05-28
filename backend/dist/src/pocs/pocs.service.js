"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const admin_audit_service_1 = require("../common/admin-audit.service");
const admin_domain_1 = require("../common/admin-domain");
const sanitize_1 = require("../common/sanitize");
const security_monitor_service_1 = require("../common/security-monitor.service");
const upload_security_service_1 = require("../common/upload-security.service");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
const allowed_tech_stack_1 = require("./allowed-tech-stack");
let PocsService = class PocsService {
    mongo;
    auditService;
    config;
    uploadSecurity;
    securityMonitor;
    constructor(mongo, auditService, config, uploadSecurity, securityMonitor) {
        this.mongo = mongo;
        this.auditService = auditService;
        this.config = config;
        this.uploadSecurity = uploadSecurity;
        this.securityMonitor = securityMonitor;
    }
    async create(dto, actor) {
        let technologies = [];
        if (Array.isArray(dto.technologies)) {
            technologies = dto.technologies;
        }
        else if (typeof dto.technologies === 'string') {
            try {
                const parsed = JSON.parse(dto.technologies);
                technologies = Array.isArray(parsed)
                    ? parsed
                    : [dto.technologies];
            }
            catch {
                technologies = [dto.technologies];
            }
        }
        else if (Array.isArray(dto.techStack)) {
            technologies = dto.techStack;
        }
        technologies = this.normalizeTechnologies(technologies);
        const categoryCollection = await this.categoryCollection();
        const pocCollection = await this.pocCollection();
        const now = new Date();
        let developerId = actor.userId;
        let assignedDeveloper = null;
        if (actor.role === client_1.Role.ADMIN) {
            const assignToEmail = dto.assignToEmail?.trim().toLowerCase();
            if (!assignToEmail) {
                throw new common_1.BadRequestException('Assign To email is required');
            }
            assignedDeveloper = await (await this.userCollection()).findOne({
                email: assignToEmail,
                role: client_1.Role.DEVELOPER,
                status: 'ACTIVE',
            });
            if (!assignedDeveloper) {
                throw new common_1.BadRequestException('Assign To must be an active developer email');
            }
            developerId = assignedDeveloper._id;
        }
        let categoryId = dto.categoryId?.trim() || undefined;
        const fileName = (0, sanitize_1.sanitizeFilename)(dto.file) ?? '';
        const fileSizeValue = dto.fileSizeBytes !== undefined ? Number(dto.fileSizeBytes) : null;
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
                id: (0, crypto_1.randomUUID)(),
                name: validatedUpload?.fileName ?? fileName,
                type: this.detectFileType(fileName),
                mimeType: validatedUpload?.mimeType ?? 'application/octet-stream',
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
            }
            else {
                const category = {
                    _id: (0, crypto_1.randomUUID)(),
                    name: categoryName,
                    description: null,
                    color: null,
                    createdAt: now,
                    updatedAt: now,
                };
                try {
                    await categoryCollection.insertOne(category);
                    categoryId = category._id;
                }
                catch (error) {
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
        const poc = {
            _id: (0, crypto_1.randomUUID)(),
            title: (0, sanitize_1.sanitizePlainText)(dto.title) ?? dto.title.trim(),
            slug: await this.generateUniqueSlug(pocCollection, dto.title),
            summary: (0, sanitize_1.sanitizeMultilineText)(dto.summary) ?? '',
            description: (0, sanitize_1.sanitizeMultilineText)(dto.description) ??
                (0, sanitize_1.sanitizeMultilineText)(dto.summary) ??
                '',
            demoUrl: null,
            documentation: (0, sanitize_1.sanitizeMultilineText)(dto.documentation) ??
                (0, sanitize_1.sanitizeFilename)(dto.file) ??
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
                problemStatement: (0, sanitize_1.sanitizeMultilineText)(dto.summary) ?? '',
                businessRequirements: (0, sanitize_1.sanitizeMultilineText)(dto.summary) ||
                    `Deliver a developer-ready proof of concept for ${dto.title.trim()} with clear handoff notes.`,
                technicalRequirements: (0, sanitize_1.sanitizeMultilineText)(dto.description) ||
                    (0, sanitize_1.sanitizeMultilineText)(dto.summary) ||
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
        }
        catch (error) {
            if (this.isDuplicateKeyError(error)) {
                throw new common_1.ConflictException('A POC with the same title already exists');
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
                type: admin_domain_1.NotificationTypes.SYSTEM_ACTIVITY,
                title: 'New POC requested',
                message: `"${poc.title}" has been assigned to ${assignedDeveloper?.email ?? actor.email}.`,
            },
        });
        return this.hydratePoc(poc);
    }
    async findAll(query, actor) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const skip = (page - 1) * pageSize;
        const filter = await this.buildMongoFilter(query);
        if (actor?.role === client_1.Role.DEVELOPER) {
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
    async findPendingApprovals(query) {
        return this.findAll({ ...query, status: admin_domain_1.PocStatuses[1] });
    }
    async findOne(id, actor) {
        const collection = await this.pocCollection();
        const poc = await collection.findOne({
            _id: id,
            ...(actor?.role === client_1.Role.DEVELOPER ? { developerId: actor.userId } : {}),
        });
        if (!poc) {
            throw new common_1.NotFoundException('POC not found');
        }
        return this.hydratePocDetail(poc);
    }
    async generateDocumentation(id, dto, actor) {
        const collection = await this.pocCollection();
        const poc = await collection.findOne({
            _id: id,
            ...(actor?.role === client_1.Role.DEVELOPER ? { developerId: actor.userId } : {}),
        });
        if (!poc) {
            throw new common_1.NotFoundException('POC not found');
        }
        const apiKey = this.config.get('GOOGLE_API_KEY')?.trim() ||
            this.config.get('GEMINI_API_KEY')?.trim();
        if (!apiKey) {
            throw new common_1.BadRequestException('Missing GOOGLE_API_KEY or GEMINI_API_KEY in backend environment configuration');
        }
        const modelCandidates = [
            this.config.get('GEMINI_DOCUMENTATION_MODEL')?.trim(),
            ...this.parseModelList(this.config.get('GEMINI_DOCUMENTATION_FALLBACK_MODELS')),
            'gemini-2.5-flash',
        ].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);
        this.securityMonitor.recordAiUsage(actor?.userId ?? 'unknown', dto.section);
        const prompt = this.buildDocumentationPrompt(poc, dto.section, dto.prompt);
        const { body, model } = await this.generateDocumentationWithRetry(apiKey, modelCandidates, prompt);
        const text = body.candidates
            ?.flatMap((candidate) => candidate.content?.parts ?? [])
            .map((part) => part.text?.trim() ?? '')
            .filter(Boolean)
            .join('\n\n');
        if (!text) {
            throw new common_1.BadRequestException('Gemini returned an empty response');
        }
        const cleanedText = this.sanitizeGeneratedDocumentation(text);
        const wasTruncated = body.candidates?.some((candidate) => candidate.finishReason === 'MAX_TOKENS');
        return {
            section: dto.section,
            content: cleanedText,
            model,
            truncated: Boolean(wasTruncated),
        };
    }
    async update(id, dto, actor) {
        const collection = await this.pocCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
        }
        const updatePayload = {
            updatedAt: new Date(),
        };
        if (dto.title !== undefined) {
            const title = dto.title.trim();
            updatePayload.title = (0, sanitize_1.sanitizePlainText)(title) ?? title;
            updatePayload.slug = await this.generateUniqueSlug(collection, title, id);
        }
        if (dto.summary !== undefined) {
            updatePayload.summary = (0, sanitize_1.sanitizeMultilineText)(dto.summary) ?? '';
        }
        if (dto.description !== undefined)
            updatePayload.description = (0, sanitize_1.sanitizeMultilineText)(dto.description) ?? '';
        if (dto.demoUrl !== undefined)
            updatePayload.demoUrl = dto.demoUrl;
        if (dto.documentation !== undefined) {
            updatePayload.documentation =
                (0, sanitize_1.sanitizeMultilineText)(dto.documentation) ?? null;
        }
        if (dto.technologies !== undefined) {
            updatePayload.technologies = this.normalizeTechnologies(dto.technologies);
        }
        if (dto.status !== undefined)
            updatePayload.status = dto.status;
        if (dto.categoryId !== undefined) {
            updatePayload.categoryId = dto.categoryId || null;
        }
        if (dto.developerId !== undefined) {
            updatePayload.developerId = dto.developerId;
        }
        if (updatePayload.title || updatePayload.slug) {
            const duplicate = await collection.findOne({
                slug: updatePayload.slug,
                _id: { $ne: id },
            });
            if (duplicate) {
                throw new common_1.ConflictException('A POC with the same title already exists');
            }
        }
        await collection.updateOne({ _id: id }, { $set: updatePayload });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('POC not found');
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
                type: admin_domain_1.NotificationTypes.SYSTEM_ACTIVITY,
                title: 'POC updated',
                message: `${updated.title} details were updated.`,
            },
        });
        return this.hydratePoc(updated);
    }
    async approve(id, dto, actor) {
        const collection = await this.pocCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
        }
        const now = new Date();
        await collection.updateOne({ _id: id }, {
            $set: {
                status: 'PUBLISHED',
                reviewNotes: dto.notes,
                rejectedReason: null,
                reviewerId: actor.userId,
                reviewedAt: now,
                publishedAt: now,
                updatedAt: now,
            },
        });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('POC not found');
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
                type: admin_domain_1.NotificationTypes.POC_APPROVED,
                title: 'POC approved',
                message: `${updated.title} is now published.`,
            },
        });
        return this.hydratePoc(updated);
    }
    async reject(id, dto, actor) {
        const collection = await this.pocCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
        }
        const now = new Date();
        await collection.updateOne({ _id: id }, {
            $set: {
                status: 'REJECTED',
                reviewNotes: dto.notes,
                rejectedReason: dto.reason,
                reviewerId: actor.userId,
                reviewedAt: now,
                publishedAt: null,
                updatedAt: now,
            },
        });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('POC not found');
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
                type: admin_domain_1.NotificationTypes.POC_REJECTED,
                title: 'POC rejected',
                message: `${updated.title} was sent back for revisions.`,
            },
        });
        return this.hydratePoc(updated);
    }
    async keepPending(id, dto, actor) {
        const collection = await this.pocCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
        }
        const now = new Date();
        await collection.updateOne({ _id: id }, {
            $set: {
                status: 'PENDING_REVIEW',
                reviewNotes: dto.notes ?? existing.reviewNotes ?? null,
                rejectedReason: null,
                reviewerId: actor.userId,
                reviewedAt: now,
                publishedAt: null,
                updatedAt: now,
            },
        });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('POC not found');
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
                type: admin_domain_1.NotificationTypes.SYSTEM_ACTIVITY,
                title: 'POC kept pending',
                message: `${updated.title} remains in pending review.`,
            },
        });
        return this.hydratePoc(updated);
    }
    async archive(id, actor) {
        const collection = await this.pocCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
        }
        await collection.updateOne({ _id: id }, { $set: { status: 'ARCHIVED', updatedAt: new Date() } });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('POC not found');
        }
        await this.auditService.record({
            actor,
            action: 'POC_ARCHIVED',
            entityType: 'POC',
            entityId: updated._id,
            metadata: { previousStatus: existing.status },
            notification: {
                type: admin_domain_1.NotificationTypes.SYSTEM_ACTIVITY,
                title: 'POC archived',
                message: `${updated.title} was archived.`,
            },
        });
        return this.hydratePoc(updated);
    }
    async remove(id, actor) {
        const pocCollection = await this.pocCollection();
        const feedbackCollection = await this.feedbackCollection();
        const existing = await pocCollection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('POC not found');
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
                type: admin_domain_1.NotificationTypes.SYSTEM_ACTIVITY,
                title: 'POC deleted',
                message: `${existing.title} was deleted.`,
            },
        });
        return { ok: true };
    }
    async buildMongoFilter(query) {
        const filter = {};
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
                { technologies: searchRegex },
                ...(developerIds.length > 0
                    ? [{ developerId: { $in: developerIds } }]
                    : []),
            ];
        }
        return filter;
    }
    resolveMongoSort(sortBy = 'createdAt', sortOrder = 'desc') {
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
    async hydratePocs(pocs) {
        const developers = await this.loadUsersByIds(pocs.map((poc) => poc.developerId).filter(Boolean));
        const categories = await this.loadCategoriesByIds(pocs
            .map((poc) => poc.categoryId)
            .filter((value) => Boolean(value)));
        return pocs.map((poc) => this.toPocEntity(poc, developers, categories));
    }
    async hydratePoc(poc) {
        const developers = await this.loadUsersByIds([poc.developerId]);
        const categories = await this.loadCategoriesByIds(poc.categoryId ? [poc.categoryId] : []);
        return this.toPocEntity(poc, developers, categories);
    }
    async hydratePocDetail(poc) {
        const developers = await this.loadUsersByIds([poc.developerId]);
        const reviewers = await this.loadUsersByIds(poc.reviewerId ? [poc.reviewerId] : []);
        const categories = await this.loadCategoriesByIds(poc.categoryId ? [poc.categoryId] : []);
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
    buildDocumentationPrompt(poc, section, rawPrompt) {
        const sectionGuidance = {
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
    sanitizeGeneratedDocumentation(text) {
        const cleaned = text
            .replace(/^#{1,6}\s*/gm, '')
            .replace(/^\s*[-*+]\s+\*\*(.+?)\*\*:\s*/gm, '$1: ')
            .replace(/^\s*[-*+]\s+\*\*(.+?)\*\*\s*/gm, '$1: ')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return cleaned.replace(/^(purpose|problem it solves|how to use it|how to use)\s*:?\s*\n*/i, '').trim();
    }
    async generateDocumentationWithRetry(apiKey, modelCandidates, prompt) {
        const maxAttemptsPerModel = 3;
        let lastErrorMessage = 'Failed to generate documentation content';
        for (const model of modelCandidates) {
            for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
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
                });
                const body = (await response.json());
                if (response.ok) {
                    return { body, model };
                }
                lastErrorMessage =
                    body.error?.message ?? 'Failed to generate documentation content';
                if (this.isRetryableGenerationError(response.status, lastErrorMessage) &&
                    attempt < maxAttemptsPerModel) {
                    await this.delay(600 * attempt);
                    continue;
                }
                if (this.isRetryableGenerationError(response.status, lastErrorMessage)) {
                    break;
                }
                throw new common_1.BadRequestException(lastErrorMessage);
            }
        }
        throw new common_1.ServiceUnavailableException(`Documentation generation is temporarily unavailable. ${lastErrorMessage}`);
    }
    isRetryableGenerationError(status, message) {
        const normalizedMessage = message.toLowerCase();
        return (status === 429 ||
            status >= 500 ||
            normalizedMessage.includes('high demand') ||
            normalizedMessage.includes('try again later') ||
            normalizedMessage.includes('temporarily unavailable') ||
            normalizedMessage.includes('overloaded') ||
            normalizedMessage.includes('rate limit'));
    }
    parseModelList(value) {
        return (value ?? '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async loadFeedbackForPoc(pocId) {
        const feedbackCollection = await this.feedbackCollection();
        const feedback = await feedbackCollection
            .find({ pocId })
            .sort({ createdAt: -1 })
            .toArray();
        const users = await this.loadUsersByIds(feedback.map((item) => item.userId));
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
    async loadUsersByIds(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];
        if (uniqueIds.length === 0) {
            return new Map();
        }
        const users = await (await this.userCollection())
            .find({ _id: { $in: uniqueIds } })
            .toArray();
        return new Map(users.map((user) => [
            user._id,
            {
                id: user._id,
                name: user.name,
                email: user.email,
                team: user.team ?? null,
                avatarUrl: user.avatarUrl ?? null,
            },
        ]));
    }
    async loadCategoriesByIds(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];
        if (uniqueIds.length === 0) {
            return new Map();
        }
        const categories = await (await this.categoryCollection())
            .find({ _id: { $in: uniqueIds } })
            .toArray();
        return new Map(categories.map((category) => [
            category._id,
            {
                id: category._id,
                name: category.name,
                color: category.color ?? null,
            },
        ]));
    }
    toPocEntity(poc, developers = new Map(), categories = new Map()) {
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
    async generateUniqueSlug(pocCollection, title, excludeId) {
        const baseSlug = title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'poc';
        let slug = baseSlug;
        let counter = 2;
        while (await pocCollection.findOne({
            slug,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        })) {
            slug = `${baseSlug}-${counter}`;
            counter += 1;
        }
        return slug;
    }
    detectFileType(name) {
        const ext = name.split('.').pop()?.toLowerCase() ?? '';
        if (['png', 'jpg', 'jpeg', 'svg'].includes(ext))
            return 'diagram';
        if (['mp4', 'mov', 'webm'].includes(ext))
            return 'video';
        if (ext === 'pdf')
            return 'pdf';
        if (ext === 'zip')
            return 'zip';
        return ext || 'file';
    }
    normalizeTechnologies(technologies) {
        const normalized = [];
        const seen = new Set();
        for (const technology of technologies) {
            const key = technology.trim().toLowerCase();
            if (!key || seen.has(key))
                continue;
            const canonical = allowed_tech_stack_1.allowedTechStackByKey.get(key);
            if (!canonical) {
                throw new common_1.BadRequestException(`Unsupported technology "${technology}". Select a valid frontend or backend language/technology.`);
            }
            seen.add(key);
            normalized.push(canonical);
        }
        return normalized;
    }
    isDuplicateKeyError(error) {
        return (!!error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 11000);
    }
    async userCollection() {
        const db = await this.mongo.getDb();
        return db.collection('User');
    }
    async categoryCollection() {
        const db = await this.mongo.getDb();
        return db.collection('Category');
    }
    async pocCollection() {
        const db = await this.mongo.getDb();
        return db.collection('POC');
    }
    async feedbackCollection() {
        const db = await this.mongo.getDb();
        return db.collection('Feedback');
    }
};
exports.PocsService = PocsService;
exports.PocsService = PocsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService,
        admin_audit_service_1.AdminAuditService,
        config_1.ConfigService,
        upload_security_service_1.UploadSecurityService,
        security_monitor_service_1.SecurityMonitorService])
], PocsService);
//# sourceMappingURL=pocs.service.js.map