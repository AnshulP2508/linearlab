"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevelopersModule = void 0;
const common_1 = require("@nestjs/common");
const mongo_module_1 = require("../mongo/mongo.module");
const users_module_1 = require("../users/users.module");
const developer_workspace_controller_1 = require("./developer-workspace.controller");
const developer_workspace_service_1 = require("./developer-workspace.service");
const developers_controller_1 = require("./developers.controller");
let DevelopersModule = class DevelopersModule {
};
exports.DevelopersModule = DevelopersModule;
exports.DevelopersModule = DevelopersModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, mongo_module_1.MongoModule],
        controllers: [developers_controller_1.DevelopersController, developer_workspace_controller_1.DeveloperWorkspaceController],
        providers: [developer_workspace_service_1.DeveloperWorkspaceService],
    })
], DevelopersModule);
//# sourceMappingURL=developers.module.js.map