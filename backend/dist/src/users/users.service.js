"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_audit_service_1 = require("../common/admin-audit.service");
const admin_domain_1 = require("../common/admin-domain");
const password_policy_1 = require("../common/password-policy");
const sanitize_1 = require("../common/sanitize");
const auth_session_service_1 = require("../auth/auth-session.service");
let UsersService = class UsersService {
    prisma;
    mongo;
    config;
    auditService;
    authSessions;
    constructor(prisma, mongo, config, auditService, authSessions) {
        this.prisma = prisma;
        this.mongo = mongo;
        this.config = config;
        this.auditService = auditService;
        this.authSessions = authSessions;
    }
    async create(dto, actor) {
        if (dto.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Cannot create ADMIN');
        }
        const email = dto.email.trim().toLowerCase();
        const collection = await this.userCollection();
        const existing = await collection.findOne({ email });
        if (existing) {
            throw new common_1.ConflictException('Email already in use');
        }
        (0, password_policy_1.assertStrongPassword)(dto.password);
        const rounds = Math.max(Number(this.config.get('BCRYPT_ROUNDS') ?? password_policy_1.MIN_BCRYPT_ROUNDS), password_policy_1.MIN_BCRYPT_ROUNDS);
        const password = await bcrypt.hash(dto.password, rounds);
        const now = new Date();
        const document = {
            _id: (0, crypto_1.randomUUID)(),
            name: (0, sanitize_1.sanitizePlainText)(dto.name) ?? dto.name.trim(),
            email,
            password,
            role: dto.role,
            status: client_1.AccountStatus.ACTIVE,
            team: null,
            avatarUrl: null,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await collection.insertOne(document);
        }
        catch (error) {
            if (error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 11000) {
                throw new common_1.ConflictException('Email already in use');
            }
            throw error;
        }
        const result = this.toUserListItem(document);
        await this.auditService.record({
            actor,
            action: 'USER_CREATED',
            entityType: 'User',
            entityId: result.id,
            metadata: { email: result.email, role: result.role },
            notification: {
                type: admin_domain_1.NotificationTypes.USER_CREATED,
                title: 'New user created',
                message: `${result.name} was added as ${result.role}.`,
            },
        });
        return result;
    }
    async findAll(query) {
        const collection = await this.userCollection();
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const skip = (page - 1) * pageSize;
        const filter = this.buildMongoFilter(query);
        const sort = this.resolveMongoSort(query.sortBy, query.sortOrder);
        const [items, total] = await Promise.all([
            collection.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
            collection.countDocuments(filter),
        ]);
        return {
            items: items.map((item) => this.toUserListItem(item)),
            total,
            page,
            pageSize,
        };
    }
    async update(id, dto, actor) {
        if (dto.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Cannot promote users to ADMIN');
        }
        const collection = await this.userCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const nextEmail = dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
        if (nextEmail && nextEmail !== existing.email.toLowerCase()) {
            const duplicate = await collection.findOne({ email: nextEmail });
            if (duplicate) {
                throw new common_1.ConflictException('Email already in use');
            }
        }
        const updatePayload = {
            updatedAt: new Date(),
        };
        if (dto.name !== undefined) {
            updatePayload.name = (0, sanitize_1.sanitizePlainText)(dto.name) ?? dto.name.trim();
        }
        if (nextEmail !== undefined)
            updatePayload.email = nextEmail;
        if (dto.role !== undefined)
            updatePayload.role = dto.role;
        if (dto.status !== undefined)
            updatePayload.status = dto.status;
        if (dto.team !== undefined) {
            updatePayload.team = (0, sanitize_1.sanitizePlainText)(dto.team) ?? null;
        }
        if (dto.avatarUrl !== undefined) {
            updatePayload.avatarUrl = dto.avatarUrl.trim();
        }
        if (dto.status !== undefined &&
            dto.status !== client_1.AccountStatus.ACTIVE &&
            dto.status !== existing.status) {
            await this.authSessions.revokeAllForUser(id);
        }
        await collection.updateOne({ _id: id }, { $set: updatePayload });
        const updated = await collection.findOne({ _id: id });
        if (!updated) {
            throw new common_1.NotFoundException('User not found after update');
        }
        const result = this.toUserListItem(updated);
        await this.auditService.record({
            actor,
            action: 'USER_UPDATED',
            entityType: 'User',
            entityId: result.id,
            metadata: {
                before: {
                    name: existing.name,
                    email: existing.email,
                    role: existing.role,
                    status: existing.status,
                    team: existing.team,
                },
                after: {
                    name: result.name,
                    email: result.email,
                    role: result.role,
                    status: result.status,
                    team: result.team,
                },
            },
            notification: {
                type: admin_domain_1.NotificationTypes.USER_UPDATED,
                title: 'User updated',
                message: `${result.name}'s account details were updated.`,
            },
        });
        return result;
    }
    async remove(id, actor) {
        if (id === actor.userId) {
            throw new common_1.ForbiddenException('Cannot delete your own account');
        }
        const collection = await this.userCollection();
        const existing = await collection.findOne({ _id: id });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const deleteResult = await collection.deleteOne({ _id: id });
        if (!deleteResult.deletedCount) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.auditService.record({
            actor,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: id,
            metadata: { email: existing.email, role: existing.role },
            notification: {
                type: admin_domain_1.NotificationTypes.USER_DELETED,
                title: 'User deleted',
                message: `${existing.name} was removed from the platform.`,
            },
        });
        return { ok: true };
    }
    async getDeveloperDirectory(query) {
        const prisma = this.prisma;
        const result = await this.findAll({
            ...query,
            role: client_1.Role.DEVELOPER,
        });
        const items = await Promise.all(result.items.map(async (developer) => {
            const stats = await prisma.pOC.aggregate({
                where: { developerId: developer.id },
                _count: { _all: true },
                _avg: { ratingAverage: true },
                _sum: { activeDemoCount: true },
            });
            const publishedCount = await prisma.pOC.count({
                where: { developerId: developer.id, status: 'PUBLISHED' },
            });
            return {
                ...developer,
                totalPocs: Number(stats?._count?._all ?? 0),
                publishedPocs: Number(publishedCount ?? 0),
                averageRating: Number(stats?._avg?.ratingAverage ?? 0),
                activeDemos: Number(stats?._sum?.activeDemoCount ?? 0),
            };
        }));
        return {
            ...result,
            items,
        };
    }
    async userCollection() {
        const db = await this.mongo.getDb();
        return db.collection('User');
    }
    buildMongoFilter(query) {
        const filter = {};
        if (query.role) {
            filter.role = query.role;
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { team: searchRegex },
            ];
        }
        return filter;
    }
    resolveMongoSort(sortBy = 'createdAt', sortOrder = 'desc') {
        const allowed = new Set([
            'name',
            'email',
            'role',
            'status',
            'createdAt',
            'updatedAt',
            'lastActiveAt',
        ]);
        const field = allowed.has(sortBy) ? sortBy : 'createdAt';
        return [[field, sortOrder === 'asc' ? 1 : -1]];
    }
    toUserListItem(user) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            team: user.team ?? null,
            avatarUrl: user.avatarUrl ?? null,
            lastActiveAt: user.lastActiveAt ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mongo_database_service_1.MongoDatabaseService,
        config_1.ConfigService,
        admin_audit_service_1.AdminAuditService,
        auth_session_service_1.AuthSessionService])
], UsersService);
//# sourceMappingURL=users.service.js.map