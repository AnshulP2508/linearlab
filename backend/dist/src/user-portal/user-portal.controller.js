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
exports.UserPortalController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const user_portal_service_1 = require("./user-portal.service");
let UserPortalController = class UserPortalController {
    userPortalService;
    constructor(userPortalService) {
        this.userPortalService = userPortalService;
    }
    getMe(req) {
        return this.userPortalService.getMe(req.user);
    }
    getPocs() {
        return this.userPortalService.getPocs();
    }
    getPocDetail(id) {
        return this.userPortalService.getPocDetail(id);
    }
    createFeedback(req, body) {
        return this.userPortalService.createFeedback(req.user, body);
    }
};
exports.UserPortalController = UserPortalController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('pocs'),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "getPocs", null);
__decorate([
    (0, common_1.Get)('pocs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "getPocDetail", null);
__decorate([
    (0, common_1.Post)('feedback'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "createFeedback", null);
exports.UserPortalController = UserPortalController = __decorate([
    (0, common_1.Controller)('user-portal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.USER),
    __metadata("design:paramtypes", [user_portal_service_1.UserPortalService])
], UserPortalController);
//# sourceMappingURL=user-portal.controller.js.map