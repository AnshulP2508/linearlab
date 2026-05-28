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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const mongodb_1 = require("mongodb");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const password_policy_1 = require("../common/password-policy");
const security_monitor_service_1 = require("../common/security-monitor.service");
const auth_session_service_1 = require("./auth-session.service");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    sessions;
    securityMonitor;
    mongo;
    constructor(prisma, jwtService, sessions, securityMonitor, mongo) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.sessions = sessions;
        this.securityMonitor = securityMonitor;
        this.mongo = mongo;
    }
    async login(dto, ipAddress) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            this.securityMonitor.recordAuthFailure(email, ipAddress);
            throw new common_1.UnauthorizedException();
        }
        const ok = await this.verifyPassword(dto.password, user.password);
        if (!ok) {
            this.securityMonitor.recordAuthFailure(email, ipAddress);
            throw new common_1.UnauthorizedException();
        }
        if (user.status !== client_1.AccountStatus.ACTIVE) {
            this.securityMonitor.recordAuthFailure(email, ipAddress);
            throw new common_1.UnauthorizedException('Account disabled');
        }
        await this.rehashPasswordIfNeeded(user.id, dto.password, user.password);
        const payload = {
            sub: user.id,
            userId: user.id,
            email: user.email,
            role: user.role,
            tokenType: 'access',
        };
        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '15m',
        });
        const refreshPayload = {
            ...payload,
            tokenType: 'refresh',
        };
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            expiresIn: `${this.sessions.getRefreshTokenTtlSeconds()}s`,
        });
        await this.sessions.createRefreshSession(user.id, refreshToken);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 15 * 60,
            role: user.role,
        };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (payload.tokenType !== 'refresh' || !payload.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.sessions.validateRefreshSession(payload.sub, refreshToken);
        const accessPayload = {
            sub: payload.sub,
            userId: payload.userId ?? payload.sub,
            email: payload.email,
            role: payload.role,
            tokenType: 'access',
        };
        const nextAccessToken = await this.jwtService.signAsync(accessPayload, {
            expiresIn: '15m',
        });
        const nextRefreshPayload = {
            ...accessPayload,
            tokenType: 'refresh',
        };
        const nextRefreshToken = await this.jwtService.signAsync(nextRefreshPayload, {
            expiresIn: `${this.sessions.getRefreshTokenTtlSeconds()}s`,
        });
        await this.sessions.rotateRefreshSession(payload.sub, refreshToken, nextRefreshToken);
        return {
            access_token: nextAccessToken,
            refresh_token: nextRefreshToken,
            expires_in: 15 * 60,
            role: payload.role,
        };
    }
    async logout(refreshToken) {
        await this.sessions.revokeRefreshSession(refreshToken);
        return { ok: true };
    }
    async rehashPasswordIfNeeded(userId, plainPassword, hashedPassword) {
        if (!this.isBcryptHash(hashedPassword)) {
            const nextHash = await bcrypt.hash(plainPassword, password_policy_1.MIN_BCRYPT_ROUNDS);
            const users = (await this.mongo.getDb()).collection('User');
            await users.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: { password: nextHash, updatedAt: new Date() } });
            return;
        }
        const rounds = Number(hashedPassword.split('$')[2] ?? 0);
        if (rounds >= password_policy_1.MIN_BCRYPT_ROUNDS) {
            return;
        }
        const nextHash = await bcrypt.hash(plainPassword, password_policy_1.MIN_BCRYPT_ROUNDS);
        const users = (await this.mongo.getDb()).collection('User');
        await users.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: { password: nextHash, updatedAt: new Date() } });
    }
    async verifyPassword(plainPassword, storedPassword) {
        if (this.isBcryptHash(storedPassword)) {
            return bcrypt.compare(plainPassword, storedPassword);
        }
        return plainPassword === storedPassword;
    }
    isBcryptHash(value) {
        return /^\$2[aby]\$\d{2}\$/.test(value);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        auth_session_service_1.AuthSessionService,
        security_monitor_service_1.SecurityMonitorService,
        mongo_database_service_1.MongoDatabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map