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
exports.DeveloperWorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const password_policy_1 = require("../common/password-policy");
const sanitize_1 = require("../common/sanitize");
const upload_security_service_1 = require("../common/upload-security.service");
const auth_session_service_1 = require("../auth/auth-session.service");
const mongo_database_service_1 = require("../mongo/mongo-database.service");
const STAGES = [
    'ASSIGNED',
    'IN_PROGRESS',
    'DEVELOPMENT_COMPLETED',
    'UNDER_ADMIN_REVIEW',
    'PUBLISHED',
];
let DeveloperWorkspaceService = class DeveloperWorkspaceService {
    mongo;
    config;
    uploadSecurity;
    authSessions;
    constructor(mongo, config, uploadSecurity, authSessions) {
        this.mongo = mongo;
        this.config = config;
        this.uploadSecurity = uploadSecurity;
        this.authSessions = authSessions;
    }
    async getMe(actor) {
        const user = await this.requireDeveloper(actor);
        const pocs = await (await this.pocCollection())
            .find({ developerId: user._id })
            .toArray();
        const statuses = pocs.map((poc) => this.resolveStage(poc));
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl ?? null,
            skills: user.skills ?? [],
            team: user.team ?? 'POC Delivery',
            stats: {
                totalAssignedPocs: pocs.length,
                inProgress: statuses.filter((status) => status === 'IN_PROGRESS')
                    .length,
                completed: statuses.filter((status) => status === 'DEVELOPMENT_COMPLETED' || status === 'PUBLISHED').length,
                underReview: statuses.filter((status) => status === 'UNDER_ADMIN_REVIEW').length,
            },
        };
    }
    async getAssignedPocs(actor, query) {
        const user = await this.requireDeveloper(actor);
        const filter = { developerId: user._id };
        if (query.search) {
            const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { title: regex },
                { summary: regex },
                { description: regex },
            ];
        }
        const pocs = await (await this.pocCollection())
            .find(filter)
            .sort({ updatedAt: -1 })
            .toArray();
        return pocs
            .map((poc) => this.toDeveloperPocSummary(poc))
            .filter((poc) => {
            if (query.status &&
                query.status !== 'ALL' &&
                poc.stage !== query.status) {
                return false;
            }
            if (query.priority &&
                query.priority !== 'ALL' &&
                poc.priority !== query.priority) {
                return false;
            }
            if (query.deadline && query.deadline !== 'ALL') {
                const deadline = new Date(poc.deadline).getTime();
                const now = Date.now();
                const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                if (query.deadline === 'THIS_WEEK' && diffDays > 7)
                    return false;
                if (query.deadline === 'OVERDUE' && diffDays >= 0)
                    return false;
                if (query.deadline === 'THIS_MONTH' && diffDays > 30)
                    return false;
            }
            return true;
        });
    }
    async getPocDetail(actor, pocId) {
        const user = await this.requireDeveloper(actor);
        const poc = await this.requireOwnedPoc(user._id, pocId);
        const feedback = await this.getFeedbackForPoc(poc._id);
        return {
            ...this.toDeveloperPocSummary(poc),
            adminInfo: this.buildAdminInfo(poc),
            developerWorkspace: this.buildDeveloperWorkspace(poc),
            feedback,
        };
    }
    async updatePoc(actor, pocId, dto) {
        const user = await this.requireDeveloper(actor);
        const poc = await this.requireOwnedPoc(user._id, pocId);
        const workspace = this.buildDeveloperWorkspace(poc);
        const now = new Date();
        if (Array.isArray(dto.addFiles) && dto.addFiles.length > 0) {
            const existingFileNames = new Set(workspace.uploadedFiles.map((file) => file.name.trim().toLowerCase()));
            const incomingFiles = dto.addFiles.map((file) => {
                const validated = this.uploadSecurity.validateFile({
                    fileName: file.name,
                    mimeType: file.mimeType,
                    contentBase64: file.contentBase64,
                    sizeBytes: file.sizeBytes,
                });
                return {
                    file,
                    name: validated?.fileName ?? file.name.trim(),
                    validated,
                };
            });
            const seenIncomingNames = new Set();
            const duplicateIncomingFile = incomingFiles.find(({ name }) => {
                const normalizedName = name.toLowerCase();
                if (seenIncomingNames.has(normalizedName)) {
                    return true;
                }
                seenIncomingNames.add(normalizedName);
                return false;
            });
            if (duplicateIncomingFile) {
                throw new common_1.BadRequestException(`A file named "${duplicateIncomingFile.name}" was added more than once`);
            }
            const duplicateFile = incomingFiles.find(({ name }) => existingFileNames.has(name.toLowerCase()));
            if (duplicateFile) {
                throw new common_1.BadRequestException(`A file named "${duplicateFile.name}" has already been uploaded for this POC`);
            }
            workspace.uploadedFiles = [
                ...workspace.uploadedFiles,
                ...incomingFiles.map(({ name, validated }) => {
                    return {
                        id: (0, crypto_1.randomUUID)(),
                        name,
                        type: this.detectFileType(name),
                        mimeType: validated?.mimeType ?? null,
                        contentBase64: validated?.contentBase64 ?? null,
                        sizeBytes: validated?.sizeBytes ?? null,
                        uploadedAt: now,
                    };
                }),
            ];
        }
        if (dto.deleteFileId) {
            workspace.uploadedFiles = workspace.uploadedFiles.filter((file) => file.id !== dto.deleteFileId);
        }
        if (dto.demoUrls) {
            workspace.demoUrls = {
                ...workspace.demoUrls,
                ...dto.demoUrls,
                liveDemoUrl: dto.demoUrls.liveDemoUrl?.trim() || workspace.demoUrls.liveDemoUrl,
                githubRepositoryUrl: dto.demoUrls.githubRepositoryUrl?.trim() ||
                    workspace.demoUrls.githubRepositoryUrl,
                videoLinkUrl: dto.demoUrls.videoLinkUrl?.trim() || workspace.demoUrls.videoLinkUrl,
            };
        }
        if (dto.explanationVideoFileName?.trim()) {
            workspace.explanationVideo = {
                id: (0, crypto_1.randomUUID)(),
                type: 'file',
                value: (0, sanitize_1.sanitizeFilename)(dto.explanationVideoFileName) ??
                    dto.explanationVideoFileName.trim(),
                thumbnailUrl: '',
                uploadedAt: now,
            };
        }
        if (dto.documentationDraft) {
            workspace.documentationDraft = {
                ...(workspace.documentationDraft ?? {}),
                purpose: (0, sanitize_1.sanitizeMultilineText)(dto.documentationDraft.purpose) ??
                    workspace.documentationDraft?.purpose ??
                    null,
                problemItSolves: (0, sanitize_1.sanitizeMultilineText)(dto.documentationDraft.problemItSolves) ??
                    workspace.documentationDraft?.problemItSolves ??
                    null,
                howToUseIt: (0, sanitize_1.sanitizeMultilineText)(dto.documentationDraft.howToUseIt) ??
                    workspace.documentationDraft?.howToUseIt ??
                    null,
                techStack: (0, sanitize_1.sanitizeMultilineText)(dto.documentationDraft.techStack) ??
                    workspace.documentationDraft?.techStack ??
                    null,
                teamBehindIt: (0, sanitize_1.sanitizeMultilineText)(dto.documentationDraft.teamBehindIt) ??
                    workspace.documentationDraft?.teamBehindIt ??
                    null,
            };
        }
        if (dto.note?.trim()) {
            workspace.notes = [
                {
                    id: (0, crypto_1.randomUUID)(),
                    message: (0, sanitize_1.sanitizeMultilineText)(dto.note) ?? dto.note.trim(),
                    createdAt: now,
                    authorEmail: actor.email,
                },
                ...workspace.notes,
            ];
        }
        if (dto.status) {
            this.assertForwardOnlyStatus(workspace.status, dto.status);
            if (dto.status === 'UNDER_ADMIN_REVIEW' || dto.status === 'PUBLISHED') {
                throw new common_1.BadRequestException('Use review submission or admin approval');
            }
            workspace.status = dto.status;
        }
        const updatePayload = {
            developerWorkspace: {
                ...workspace,
                updatedAt: now,
            },
            updatedAt: now,
        };
        if (dto.submitForReview) {
            if (workspace.status !== 'DEVELOPMENT_COMPLETED') {
                throw new common_1.BadRequestException('POC must be marked as Development Completed before review submission');
            }
            updatePayload.status = 'PENDING_REVIEW';
            updatePayload.developerWorkspace = {
                ...workspace,
                status: 'UNDER_ADMIN_REVIEW',
                submittedForReviewAt: now,
                updatedAt: now,
            };
        }
        await (await this.pocCollection()).updateOne({ _id: pocId, developerId: user._id }, { $set: updatePayload });
        return this.getPocDetail(actor, pocId);
    }
    async getFeedback(actor, query) {
        const user = await this.requireDeveloper(actor);
        const pocs = await (await this.pocCollection())
            .find({ developerId: user._id })
            .toArray();
        const feedbackGroups = await Promise.all(pocs.map(async (poc) => this.getFeedbackForPoc(poc._id)));
        return feedbackGroups
            .flat()
            .filter((item) => {
            if (query.type && query.type !== 'ALL' && item.type !== query.type) {
                return false;
            }
            if (query.pocId && item.pocId !== query.pocId) {
                return false;
            }
            return true;
        })
            .sort((left, right) => {
            return (new Date(right.createdAt).getTime() -
                new Date(left.createdAt).getTime());
        });
    }
    async updateProfile(actor, dto) {
        const user = await this.requireDeveloper(actor);
        const updatePayload = {
            updatedAt: new Date(),
        };
        if (dto.name?.trim()) {
            updatePayload.name = (0, sanitize_1.sanitizePlainText)(dto.name) ?? dto.name.trim();
        }
        if (dto.avatarUrl !== undefined)
            updatePayload.avatarUrl = dto.avatarUrl.trim();
        if (dto.skills) {
            updatePayload.skills = dto.skills
                .map((skill) => (0, sanitize_1.sanitizePlainText)(skill) ?? skill.trim())
                .filter(Boolean);
        }
        await (await this.userCollection()).updateOne({ _id: user._id }, { $set: updatePayload });
        return this.getMe(actor);
    }
    async changePassword(actor, dto) {
        const user = await this.requireDeveloper(actor);
        if (!dto.currentPassword || !dto.newPassword) {
            throw new common_1.BadRequestException('Current and new password are required');
        }
        const ok = await bcrypt.compare(dto.currentPassword, user.password);
        if (!ok) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        (0, password_policy_1.assertStrongPassword)(dto.newPassword, 'New password');
        const rounds = Math.max(Number(this.config.get('BCRYPT_ROUNDS') ?? password_policy_1.MIN_BCRYPT_ROUNDS), password_policy_1.MIN_BCRYPT_ROUNDS);
        const password = await bcrypt.hash(dto.newPassword, rounds);
        await (await this.userCollection()).updateOne({ _id: user._id }, { $set: { password, updatedAt: new Date() } });
        await this.authSessions.revokeAllForUser(user._id);
        return { ok: true };
    }
    shouldHideFromDeveloperFeedback(item, poc) {
        if (item._id.endsWith('-admin-comment') ||
            item._id.endsWith('-bug-report')) {
            return true;
        }
        const comment = item.comment.trim();
        if (!comment || !poc) {
            return false;
        }
        return (comment === (poc.reviewNotes?.trim() ?? '') ||
            comment === (poc.rejectedReason?.trim() ?? ''));
    }
    async getFeedbackForPoc(pocId) {
        const poc = await (await this.pocCollection()).findOne({ _id: pocId });
        const feedbackDocs = await (await this.feedbackCollection())
            .find({ pocId })
            .sort({ createdAt: -1 })
            .toArray();
        const users = await this.loadUsersByIds(feedbackDocs.map((item) => item.userId));
        return feedbackDocs
            .filter((item) => !this.shouldHideFromDeveloperFeedback(item, poc))
            .map((item) => ({
            id: item._id,
            pocId: item.pocId,
            rating: item.rating,
            comment: item.comment,
            type: item.type ?? 'USER_FEEDBACK',
            status: item.status,
            user: users.get(item.userId) ?? {
                id: item.userId,
                name: 'Unknown User',
            },
            createdAt: item.createdAt.toISOString(),
        }));
    }
    toDeveloperPocSummary(poc) {
        const workspace = this.buildDeveloperWorkspace(poc);
        return {
            id: poc._id,
            title: poc.title,
            slug: poc.slug,
            assignedBy: poc.assignedByName ?? 'Admin Control',
            assignedDate: (poc.assignedAt ?? poc.createdAt).toISOString(),
            deadline: (poc.deadline ?? this.defaultDeadline(poc.createdAt)).toISOString(),
            priority: poc.priority ?? 'MEDIUM',
            stage: this.resolveStage(poc),
            summary: poc.summary,
            description: poc.description,
            technologies: poc.technologies ?? [],
            documentationCount: workspace.uploadedFiles.length,
            demoUrls: workspace.demoUrls,
            hasExplanationVideo: Boolean(workspace.explanationVideo),
        };
    }
    buildAdminInfo(poc) {
        const info = poc.adminInfo;
        return {
            problemStatement: info?.problemStatement ??
                poc.summary ??
                'Business problem pending elaboration.',
            businessRequirements: info?.businessRequirements ??
                `Deliver a developer-ready proof of concept for ${poc.title} with clear handoff notes.`,
            technicalRequirements: info?.technicalRequirements ??
                poc.description ??
                'Build the requested workflow and provide implementation evidence.',
            suggestedTechStack: info?.suggestedTechStack ?? poc.technologies ?? [],
            supportDocuments: info?.supportDocuments ??
                (poc.documentation ? [poc.documentation] : ['Briefing document.pdf']),
            referenceLinks: info?.referenceLinks ?? [],
            deadline: (poc.deadline ?? this.defaultDeadline(poc.createdAt)).toISOString(),
        };
    }
    buildDeveloperWorkspace(poc) {
        if (poc.developerWorkspace) {
            return {
                ...poc.developerWorkspace,
                uploadedFiles: poc.developerWorkspace.uploadedFiles ?? [],
                demoUrls: poc.developerWorkspace.demoUrls ?? {},
                documentationDraft: poc.developerWorkspace.documentationDraft ?? {},
                notes: poc.developerWorkspace.notes ?? [],
                updatedAt: poc.developerWorkspace.updatedAt ?? poc.updatedAt,
            };
        }
        return {
            status: poc.status === 'PUBLISHED' ? 'PUBLISHED' : 'ASSIGNED',
            uploadedFiles: [],
            demoUrls: poc.demoUrl ? { liveDemoUrl: poc.demoUrl } : {},
            explanationVideo: null,
            documentationDraft: {},
            notes: [],
            submittedForReviewAt: null,
            updatedAt: poc.updatedAt,
        };
    }
    resolveStage(poc) {
        if (poc.status === 'PUBLISHED')
            return 'PUBLISHED';
        return this.buildDeveloperWorkspace(poc).status;
    }
    assertForwardOnlyStatus(current, next) {
        const currentIndex = STAGES.indexOf(current);
        const nextIndex = STAGES.indexOf(next);
        if (nextIndex === -1) {
            throw new common_1.BadRequestException('Invalid status transition');
        }
        if (nextIndex <= currentIndex) {
            throw new common_1.BadRequestException('Status can only move forward');
        }
        if (nextIndex - currentIndex > 1) {
            throw new common_1.BadRequestException('Move status one step at a time');
        }
    }
    async requireDeveloper(actor) {
        if (actor.role !== client_1.Role.DEVELOPER) {
            throw new common_1.ForbiddenException('Developer access only');
        }
        const user = await (await this.userCollection()).findOne({ _id: actor.userId });
        if (!user) {
            throw new common_1.NotFoundException('Developer not found');
        }
        return user;
    }
    async requireOwnedPoc(developerId, pocId) {
        const poc = await (await this.pocCollection()).findOne({
            _id: pocId,
            developerId,
        });
        if (!poc) {
            throw new common_1.NotFoundException('Assigned POC not found');
        }
        return poc;
    }
    async loadUsersByIds(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];
        if (uniqueIds.length === 0) {
            return new Map();
        }
        const users = await (await this.userCollection())
            .find({ _id: { $in: uniqueIds } })
            .toArray();
        return new Map(users.map((user) => [user._id, { id: user._id, name: user.name }]));
    }
    defaultDeadline(createdAt) {
        return new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);
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
    buildVideoThumbnail(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
        if (match) {
            return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
        return '';
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
};
exports.DeveloperWorkspaceService = DeveloperWorkspaceService;
exports.DeveloperWorkspaceService = DeveloperWorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_database_service_1.MongoDatabaseService,
        config_1.ConfigService,
        upload_security_service_1.UploadSecurityService,
        auth_session_service_1.AuthSessionService])
], DeveloperWorkspaceService);
//# sourceMappingURL=developer-workspace.service.js.map