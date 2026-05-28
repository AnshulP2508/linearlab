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
exports.UploadSecurityService = void 0;
const common_1 = require("@nestjs/common");
const security_monitor_service_1 = require("./security-monitor.service");
const sanitize_1 = require("./sanitize");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const allowedExtensions = new Set([
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'svg',
    'webp',
    'txt',
    'md',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'xls',
    'xlsx',
    'zip',
    'mp4',
    'mov',
    'webm',
]);
const blockedExtensions = new Set([
    'exe',
    'dll',
    'bat',
    'cmd',
    'sh',
    'ps1',
    'js',
    'jar',
    'msi',
    'com',
    'scr',
]);
let UploadSecurityService = class UploadSecurityService {
    monitor;
    constructor(monitor) {
        this.monitor = monitor;
    }
    validateFile(input) {
        const fileName = (0, sanitize_1.sanitizeFilename)(input.fileName);
        if (!fileName) {
            return null;
        }
        const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
        if (!extension || blockedExtensions.has(extension)) {
            this.reject('blocked_extension', { fileName, extension });
        }
        if (!allowedExtensions.has(extension)) {
            this.reject('unsupported_extension', { fileName, extension });
        }
        const sizeBytes = Number.isFinite(input.sizeBytes)
            ? Number(input.sizeBytes)
            : this.estimateBase64Bytes(input.contentBase64);
        if (sizeBytes > MAX_UPLOAD_BYTES) {
            this.reject('file_too_large', { fileName, sizeBytes });
        }
        const mimeType = input.mimeType?.trim() || 'application/octet-stream';
        if (mimeType.includes('javascript') ||
            mimeType.includes('x-msdownload') ||
            mimeType.includes('x-sh')) {
            this.reject('blocked_mime_type', { fileName, mimeType });
        }
        return {
            fileName,
            mimeType,
            sizeBytes,
            contentBase64: input.contentBase64?.trim() || null,
        };
    }
    estimateBase64Bytes(contentBase64) {
        if (!contentBase64) {
            return 0;
        }
        const normalized = contentBase64.trim();
        const padding = normalized.endsWith('==')
            ? 2
            : normalized.endsWith('=')
                ? 1
                : 0;
        return Math.floor((normalized.length * 3) / 4) - padding;
    }
    reject(reason, metadata) {
        this.monitor.recordUploadRejected(reason, metadata);
        throw new common_1.BadRequestException(`Upload rejected: ${reason.replace(/_/g, ' ')}`);
    }
};
exports.UploadSecurityService = UploadSecurityService;
exports.UploadSecurityService = UploadSecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_monitor_service_1.SecurityMonitorService])
], UploadSecurityService);
//# sourceMappingURL=upload-security.service.js.map