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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const admin_audit_service_1 = require("../common/admin-audit.service");
const admin_domain_1 = require("../common/admin-domain");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
let CategoriesService = class CategoriesService {
    mongo;
    auditService;
    constructor(mongo, auditService) {
        this.mongo = mongo;
        this.auditService = auditService;
    }
    async findAll() {
        const [categories, pocs] = await Promise.all([
            (await this.categoryCollection()).find().sort({ name: 1 }).toArray(),
            (await this.pocCollection())
                .find({}, { projection: { categoryId: 1 } })
                .toArray(),
        ]);
        const usageCounts = new Map();
        for (const poc of pocs) {
            if (!poc.categoryId)
                continue;
            usageCounts.set(poc.categoryId, (usageCounts.get(poc.categoryId) ?? 0) + 1);
        }
        return categories.map((category) => ({
            id: category._id,
            name: category.name,
            description: category.description ?? null,
            color: category.color ?? null,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            usageCount: usageCounts.get(category._id) ?? 0,
        }));
    }
    async create(dto, actor) {
        const collection = await this.categoryCollection();
        const now = new Date();
        const category = {
            _id: (0, crypto_1.randomUUID)(),
            name: dto.name.trim(),
            description: dto.description ?? null,
            color: dto.color ?? null,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await collection.insertOne(category);
        }
        catch (error) {
            if (this.isDuplicateKeyError(error)) {
                throw new common_1.ConflictException('Category name already exists');
            }
            throw error;
        }
        await this.auditService.record({
            actor,
            action: 'CATEGORY_CREATED',
            entityType: 'Category',
            entityId: category._id,
            metadata: { name: category.name },
            notification: {
                type: admin_domain_1.NotificationTypes.CATEGORY_UPDATED,
                title: 'Category created',
                message: `${category.name} is now available for POCs.`,
            },
        });
        return {
            id: category._id,
            name: category.name,
            description: category.description,
            color: category.color,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
    async update(id, dto, actor) {
        const collection = await this.categoryCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('Category not found');
        }
        const updatePayload = {
            updatedAt: new Date(),
        };
        if (dto.name !== undefined)
            updatePayload.name = dto.name.trim();
        if (dto.description !== undefined) {
            updatePayload.description = dto.description;
        }
        if (dto.color !== undefined)
            updatePayload.color = dto.color;
        if (updatePayload.name && updatePayload.name !== existing.name) {
            const duplicate = await collection.findOne({
                name: updatePayload.name,
                _id: { $ne: id },
            });
            if (duplicate) {
                throw new common_1.ConflictException('Category name already exists');
            }
        }
        await collection.updateOne({ _id: id }, { $set: updatePayload });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('Category not found');
        }
        await this.auditService.record({
            actor,
            action: 'CATEGORY_UPDATED',
            entityType: 'Category',
            entityId: updated._id,
            metadata: {
                before: {
                    name: existing.name,
                    description: existing.description ?? null,
                    color: existing.color ?? null,
                },
                after: {
                    name: updated.name,
                    description: updated.description ?? null,
                    color: updated.color ?? null,
                },
            },
            notification: {
                type: admin_domain_1.NotificationTypes.CATEGORY_UPDATED,
                title: 'Category updated',
                message: `${updated.name} category settings were changed.`,
            },
        });
        return {
            id: updated._id,
            name: updated.name,
            description: updated.description ?? null,
            color: updated.color ?? null,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };
    }
    async remove(id, actor) {
        const categoryCollection = await this.categoryCollection();
        const pocCollection = await this.pocCollection();
        const existing = await categoryCollection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('Category not found');
        }
        await categoryCollection.deleteOne({ _id: id });
        await pocCollection.updateMany({ categoryId: id }, { $set: { categoryId: null } });
        await this.auditService.record({
            actor,
            action: 'CATEGORY_DELETED',
            entityType: 'Category',
            entityId: id,
            metadata: { name: existing.name },
            notification: {
                type: admin_domain_1.NotificationTypes.CATEGORY_UPDATED,
                title: 'Category removed',
                message: `${existing.name} was deleted.`,
            },
        });
        return { ok: true };
    }
    isDuplicateKeyError(error) {
        return (!!error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 11000);
    }
    async categoryCollection() {
        const db = await this.mongo.getDb();
        return db.collection('Category');
    }
    async pocCollection() {
        const db = await this.mongo.getDb();
        return db.collection('POC');
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService,
        admin_audit_service_1.AdminAuditService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map