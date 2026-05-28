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
exports.UserPortalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
const sanitize_1 = require("../common/sanitize");
let UserPortalService = class UserPortalService {
    mongo;
    constructor(mongo) {
        this.mongo = mongo;
    }
    async getMe(actor) {
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
        const categories = await this.loadCategoriesByIds(pocs
            .map((poc) => poc.categoryId)
            .filter((value) => Boolean(value)));
        const feedbackByPoc = await this.loadFeedbackForPocIds(pocs.map((poc) => poc._id));
        return {
            items: pocs.map((poc) => this.toUserPocSummary(poc, developers.get(poc.developerId) ?? null, poc.categoryId ? (categories.get(poc.categoryId) ?? null) : null, feedbackByPoc.get(poc._id) ?? [])),
            total: pocs.length,
            page: 1,
            pageSize: pocs.length,
        };
    }
    async getPocDetail(id) {
        const poc = await (await this.pocCollection()).findOne({
            _id: id,
            status: { $ne: 'ARCHIVED' },
        });
        if (!poc) {
            throw new common_1.NotFoundException('POC not found');
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
    async createFeedback(actor, body) {
        const user = await this.requireUser(actor);
        const pocId = body.pocId.trim();
        const comment = (0, sanitize_1.sanitizeMultilineText)(body.comment) ?? body.comment.trim();
        const rating = body.rating;
        if (!pocId) {
            throw new common_1.BadRequestException('POC id is required');
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const pocCollection = await this.pocCollection();
        const feedbackCollection = await this.feedbackCollection();
        const poc = await pocCollection.findOne({
            _id: pocId,
            status: { $ne: 'ARCHIVED' },
        });
        if (!poc) {
            throw new common_1.NotFoundException('POC not found');
        }
        const now = new Date();
        const feedback = {
            _id: (0, crypto_1.randomUUID)(),
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
        const ratingAverage = ratingCount > 0
            ? Number((allFeedback.reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(1))
            : 0;
        await pocCollection.updateOne({ _id: pocId }, {
            $set: {
                ratingCount,
                ratingAverage,
                updatedAt: now,
            },
        });
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
    buildDocuments(poc) {
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
    buildDemos(poc) {
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
                    label: explanationVideo.type === 'url'
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
    toUserPocSummary(poc, developer, category, feedbacks) {
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
    async loadFeedbackForPocIds(pocIds) {
        const uniquePocIds = [...new Set(pocIds.filter(Boolean))];
        const result = new Map();
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
                user: users.get(item.userId) ?? {
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
    async loadUsersByIds(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];
        const result = new Map();
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
    async loadCategoriesByIds(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];
        const result = new Map();
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
    async requireUser(actor) {
        if (actor.role !== client_1.Role.USER) {
            throw new common_1.NotFoundException('User not found');
        }
        const user = await (await this.userCollection()).findOne({ _id: actor.userId });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async userCollection() {
        const db = await this.mongo.getDb();
        return db.collection('User');
    }
    async pocCollection() {
        const db = await this.mongo.getDb();
        return db.collection('POC');
    }
    async feedbackCollection() {
        const db = await this.mongo.getDb();
        return db.collection('Feedback');
    }
    async categoryCollection() {
        const db = await this.mongo.getDb();
        return db.collection('Category');
    }
};
exports.UserPortalService = UserPortalService;
exports.UserPortalService = UserPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService])
], UserPortalService);
//# sourceMappingURL=user-portal.service.js.map