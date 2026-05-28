"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPortalModule = void 0;
const common_1 = require("@nestjs/common");
const user_portal_controller_1 = require("./user-portal.controller");
const user_portal_service_1 = require("./user-portal.service");
let UserPortalModule = class UserPortalModule {
};
exports.UserPortalModule = UserPortalModule;
exports.UserPortalModule = UserPortalModule = __decorate([
    (0, common_1.Module)({
        controllers: [user_portal_controller_1.UserPortalController],
        providers: [user_portal_service_1.UserPortalService],
    })
], UserPortalModule);
//# sourceMappingURL=user-portal.module.js.map