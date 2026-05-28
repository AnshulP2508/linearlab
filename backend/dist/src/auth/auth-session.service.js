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
exports.AuthSessionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
let AuthSessionService = class AuthSessionService {
    mongo;
    config;
    constructor(mongo, config) {
        this.mongo = mongo;
        this.config = config;
    }
    async createRefreshSession(userId, refreshToken) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.getRefreshTokenTtlSeconds() * 1000);
        const session = {
            _id: (0, crypto_1.randomUUID)(),
            userId,
            tokenHash: this.hashToken(refreshToken),
            expiresAt,
            revokedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        await (await this.refreshCollection()).insertOne(session);
        return session;
    }
    async validateRefreshSession(userId, refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const session = await (await this.refreshCollection()).findOne({
            userId,
            tokenHash,
            revokedAt: null,
        });
        if (!session || session.expiresAt.getTime() <= Date.now()) {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired');
        }
        return session;
    }
    async rotateRefreshSession(userId, currentToken, nextToken) {
        const session = await this.validateRefreshSession(userId, currentToken);
        const now = new Date();
        await (await this.refreshCollection()).updateOne({ _id: session._id }, { $set: { revokedAt: now, updatedAt: now } });
        return this.createRefreshSession(userId, nextToken);
    }
    async revokeRefreshSession(refreshToken) {
        await (await this.refreshCollection()).updateOne({ tokenHash: this.hashToken(refreshToken), revokedAt: null }, { $set: { revokedAt: new Date(), updatedAt: new Date() } });
    }
    async revokeAllForUser(userId) {
        await (await this.refreshCollection()).updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date(), updatedAt: new Date() } });
    }
    getRefreshTokenTtlSeconds() {
        return Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 14);
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async refreshCollection() {
        const db = await this.mongo.getDb();
        return db.collection('RefreshSession');
    }
};
exports.AuthSessionService = AuthSessionService;
exports.AuthSessionService = AuthSessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService,
        config_1.ConfigService])
], AuthSessionService);
//# sourceMappingURL=auth-session.service.js.map