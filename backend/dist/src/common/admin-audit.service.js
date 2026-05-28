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
exports.AdminAuditService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
let AdminAuditService = class AdminAuditService {
    mongo;
    constructor(mongo) {
        this.mongo = mongo;
    }
    async record(event) {
        const db = await this.mongo.getDb();
        const now = new Date();
        const activity = {
            _id: (0, crypto_1.randomUUID)(),
            action: event.action,
            entityType: event.entityType,
            entityId: event.entityId,
            performedById: event.actor.userId,
            performedByEmail: event.actor.email,
            metadata: event.metadata ?? null,
            createdAt: now,
        };
        await db.collection('ActivityLog').insertOne(activity);
        if (event.notification) {
            const notification = {
                _id: (0, crypto_1.randomUUID)(),
                type: event.notification.type,
                title: event.notification.title,
                message: event.notification.message,
                entityType: event.entityType,
                entityId: event.entityId,
                read: false,
                createdAt: now,
            };
            await db
                .collection('AdminNotification')
                .insertOne(notification);
        }
    }
};
exports.AdminAuditService = AdminAuditService;
exports.AdminAuditService = AdminAuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService])
], AdminAuditService);
//# sourceMappingURL=admin-audit.service.js.map