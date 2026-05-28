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
exports.DeveloperWorkspaceController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const change_password_dto_1 = require("./dto/change-password.dto");
const update_developer_poc_dto_1 = require("./dto/update-developer-poc.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const developer_workspace_service_1 = require("./developer-workspace.service");
let DeveloperWorkspaceController = class DeveloperWorkspaceController {
    developerWorkspaceService;
    constructor(developerWorkspaceService) {
        this.developerWorkspaceService = developerWorkspaceService;
    }
    getMe(req) {
        return this.developerWorkspaceService.getMe(req.user);
    }
    getAssignedPocs(req, status, priority, deadline, search) {
        return this.developerWorkspaceService.getAssignedPocs(req.user, {
            status,
            priority,
            deadline,
            search,
        });
    }
    getPocDetail(req, id) {
        return this.developerWorkspaceService.getPocDetail(req.user, id);
    }
    updatePoc(req, id, body) {
        return this.developerWorkspaceService.updatePoc(req.user, id, body);
    }
    getFeedback(req, type, pocId) {
        return this.developerWorkspaceService.getFeedback(req.user, { type, pocId });
    }
    updateProfile(req, body) {
        return this.developerWorkspaceService.updateProfile(req.user, body);
    }
    changePassword(req, body) {
        return this.developerWorkspaceService.changePassword(req.user, body);
    }
};
exports.DeveloperWorkspaceController = DeveloperWorkspaceController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('pocs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('deadline')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "getAssignedPocs", null);
__decorate([
    (0, common_1.Get)('pocs/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "getPocDetail", null);
__decorate([
    (0, common_1.Patch)('pocs/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_developer_poc_dto_1.UpdateDeveloperPocDto]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "updatePoc", null);
__decorate([
    (0, common_1.Get)('feedback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('pocId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "getFeedback", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], DeveloperWorkspaceController.prototype, "changePassword", null);
exports.DeveloperWorkspaceController = DeveloperWorkspaceController = __decorate([
    (0, common_1.Controller)('developer-workspace'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DEVELOPER),
    __metadata("design:paramtypes", [developer_workspace_service_1.DeveloperWorkspaceService])
], DeveloperWorkspaceController);
//# sourceMappingURL=developer-workspace.controller.js.map