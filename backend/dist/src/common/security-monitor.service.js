"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SecurityMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMonitorService = void 0;
const common_1 = require("@nestjs/common");
let SecurityMonitorService = SecurityMonitorService_1 = class SecurityMonitorService {
    logger = new common_1.Logger(SecurityMonitorService_1.name);
    counters = new Map();
    windowMs = 15 * 60 * 1000;
    recordAuthFailure(email, ip) {
        this.bump(`auth:${email.toLowerCase()}`);
        if (ip) {
            this.bump(`auth-ip:${ip}`);
        }
        this.logger.warn(JSON.stringify({
            event: 'auth.failure',
            email,
            ip: ip ?? null,
        }));
    }
    recordPermissionDenied(userId, role) {
        this.logger.warn(JSON.stringify({
            event: 'auth.permission_denied',
            userId: userId ?? null,
            role: role ?? null,
        }));
    }
    recordUploadRejected(reason, metadata) {
        this.bump(`upload:${reason}`);
        this.logger.warn(JSON.stringify({
            event: 'upload.rejected',
            reason,
            metadata: metadata ?? null,
        }));
    }
    recordAiUsage(userId, section) {
        this.bump(`ai:${userId}`);
        this.logger.log(JSON.stringify({
            event: 'ai.documentation_generation',
            userId,
            section,
        }));
    }
    bump(key) {
        const now = Date.now();
        const current = this.counters.get(key);
        if (!current || now - current.firstSeenAt > this.windowMs) {
            this.counters.set(key, { count: 1, firstSeenAt: now });
            return;
        }
        const next = { ...current, count: current.count + 1 };
        this.counters.set(key, next);
        if (next.count >= 5) {
            this.logger.warn(JSON.stringify({
                event: 'security.threshold_reached',
                key,
                count: next.count,
                windowMs: this.windowMs,
            }));
        }
    }
};
exports.SecurityMonitorService = SecurityMonitorService;
exports.SecurityMonitorService = SecurityMonitorService = SecurityMonitorService_1 = __decorate([
    (0, common_1.Injectable)()
], SecurityMonitorService);
//# sourceMappingURL=security-monitor.service.js.map