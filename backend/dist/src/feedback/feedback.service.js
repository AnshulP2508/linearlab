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
exports.FeedbackService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_audit_service_1 = require("../common/admin-audit.service");
const admin_domain_1 = require("../common/admin-domain");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
const sanitize_1 = require("../common/sanitize");
let FeedbackService = class FeedbackService {
    prisma;
    auditService;
    mongo;
    constructor(prisma, auditService, mongo) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.mongo = mongo;
    }
    async findAll(query) {
        const prisma = this.prisma;
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.pocId) {
            where.pocId = query.pocId;
        }
        if (query.search) {
            where.OR = [
                { comment: { contains: query.search } },
                {
                    poc: {
                        is: {
                            title: { contains: query.search },
                        },
                    },
                },
                {
                    user: {
                        is: {
                            name: { contains: query.search },
                        },
                    },
                },
            ];
        }
        const [items, total] = await Promise.all([
            prisma.feedback.findMany({
                where,
                select: {
                    id: true,
                    pocId: true,
                    userId: true,
                    rating: true,
                    comment: true,
                    status: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                    poc: {
                        select: { id: true, title: true, status: true },
                    },
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.feedback.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
    async moderate(id, dto, actor) {
        const prisma = this.prisma;
        const feedback = await prisma.feedback.findUnique({ where: { id } });
        if (!feedback) {
            throw new common_1.NotFoundException('Feedback not found');
        }
        const updated = await prisma.feedback.update({
            where: { id },
            data: { status: dto.status },
            include: {
                poc: { select: { title: true } },
                user: { select: { name: true } },
            },
        });
        await this.auditService.record({
            actor,
            action: 'FEEDBACK_MODERATED',
            entityType: 'Feedback',
            entityId: updated.id,
            metadata: {
                previousStatus: feedback.status,
                nextStatus: updated.status,
            },
            notification: {
                type: admin_domain_1.NotificationTypes.FEEDBACK_MODERATED,
                title: 'Feedback moderated',
                message: `Feedback on ${updated.poc.title} is now ${updated.status.toLowerCase()}.`,
            },
        });
        return updated;
    }
    async remove(id, actor) {
        const prisma = this.prisma;
        const feedback = await prisma.feedback.findUnique({
            where: { id },
            include: {
                poc: { select: { title: true } },
                user: { select: { name: true } },
            },
        });
        if (!feedback) {
            throw new common_1.NotFoundException('Feedback not found');
        }
        await prisma.feedback.delete({ where: { id } });
        await this.auditService.record({
            actor,
            action: 'FEEDBACK_DELETED',
            entityType: 'Feedback',
            entityId: id,
            metadata: { pocTitle: feedback.poc.title, userName: feedback.user.name },
            notification: {
                type: admin_domain_1.NotificationTypes.FEEDBACK_MODERATED,
                title: 'Feedback removed',
                message: `A comment on ${feedback.poc.title} was deleted.`,
            },
        });
        return { ok: true };
    }
    async createAdminFeedback(dto, actor) {
        const comment = (0, sanitize_1.sanitizeMultilineText)(dto.comment) ?? dto.comment.trim();
        if (!comment) {
            throw new common_1.BadRequestException('Comment is required');
        }
        const db = await this.mongo.getDb();
        const pocCollection = db.collection('POC');
        const feedbackCollection = db.collection('Feedback');
        const poc = await pocCollection.findOne({ _id: dto.pocId });
        if (!poc) {
            throw new common_1.NotFoundException('POC not found');
        }
        const now = new Date();
        const feedback = {
            _id: (0, crypto_1.randomUUID)(),
            pocId: dto.pocId,
            userId: actor.userId,
            rating: dto.rating ?? 0,
            comment,
            type: 'ADMIN_COMMENT',
            status: 'VISIBLE',
            createdAt: now,
            updatedAt: now,
        };
        await feedbackCollection.insertOne(feedback);
        const adminUser = await this.prisma.user.findUnique({
            where: { id: actor.userId },
            select: { name: true, email: true },
        });
        await this.auditService.record({
            actor,
            action: 'FEEDBACK_CREATED',
            entityType: 'Feedback',
            entityId: feedback._id,
            metadata: { pocTitle: poc.title, pocId: dto.pocId },
            notification: {
                type: admin_domain_1.NotificationTypes.FEEDBACK_RECEIVED,
                title: 'Admin feedback submitted',
                message: `Feedback was added for "${poc.title}".`,
            },
        });
        return {
            id: feedback._id,
            pocId: feedback.pocId,
            userId: feedback.userId,
            rating: feedback.rating,
            comment: feedback.comment,
            type: feedback.type,
            status: feedback.status,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt,
            poc: {
                id: String(poc._id),
                title: poc.title,
                status: poc.status,
            },
            user: {
                id: actor.userId,
                name: adminUser?.name ?? 'Admin',
                email: adminUser?.email ?? actor.email,
            },
        };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        admin_audit_service_1.AdminAuditService,
        mongo_database_service_1.MongoDatabaseService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map