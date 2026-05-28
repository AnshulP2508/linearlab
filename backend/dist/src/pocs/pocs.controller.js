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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const create_poc_dto_1 = require("./dto/create-poc.dto");
const generate_documentation_dto_1 = require("./dto/generate-documentation.dto");
const query_pocs_dto_1 = require("./dto/query-pocs.dto");
const review_poc_dto_1 = require("./dto/review-poc.dto");
const update_poc_dto_1 = require("./dto/update-poc.dto");
const pocs_service_1 = require("./pocs.service");
let PocsController = class PocsController {
    pocsService;
    constructor(pocsService) {
        this.pocsService = pocsService;
    }
    findAll(query, req) {
        return this.pocsService.findAll(query, req.user);
    }
    create(dto, req) {
        return this.pocsService.create(dto, req.user);
    }
    findPendingApprovals(query) {
        return this.pocsService.findPendingApprovals(query);
    }
    findOne(id, req) {
        return this.pocsService.findOne(id, req.user);
    }
    generateDocumentation(id, dto, req) {
        return this.pocsService.generateDocumentation(id, dto, req.user);
    }
    update(id, dto, req) {
        return this.pocsService.update(id, dto, req.user);
    }
    approve(id, dto, req) {
        return this.pocsService.approve(id, dto, req.user);
    }
    reject(id, dto, req) {
        return this.pocsService.reject(id, dto, req.user);
    }
    keepPending(id, dto, req) {
        return this.pocsService.keepPending(id, dto, req.user);
    }
    archive(id, req) {
        return this.pocsService.archive(id, req.user);
    }
    remove(id, req) {
        return this.pocsService.remove(id, req.user);
    }
};
exports.PocsController = PocsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.DEVELOPER),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pocs_dto_1.QueryPocsDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.DEVELOPER),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_poc_dto_1.CreatePocDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('approvals'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pocs_dto_1.QueryPocsDto]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "findPendingApprovals", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.DEVELOPER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/documentation/generate'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.DEVELOPER),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_documentation_dto_1.GenerateDocumentationDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "generateDocumentation", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_poc_dto_1.UpdatePocDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_poc_dto_1.ReviewPocDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_poc_dto_1.ReviewPocDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/pending'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_poc_dto_1.ReviewPocDto, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "keepPending", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "archive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PocsController.prototype, "remove", null);
exports.PocsController = PocsController = __decorate([
    (0, common_1.Controller)('pocs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [pocs_service_1.PocsService])
], PocsController);
//# sourceMappingURL=pocs.controller.js.map