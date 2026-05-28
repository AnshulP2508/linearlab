"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocsModule = void 0;
const common_1 = require("@nestjs/common");
const pocs_controller_1 = require("./pocs.controller");
const pocs_service_1 = require("./pocs.service");
let PocsModule = class PocsModule {
};
exports.PocsModule = PocsModule;
exports.PocsModule = PocsModule = __decorate([
    (0, common_1.Module)({
        controllers: [pocs_controller_1.PocsController],
        providers: [pocs_service_1.PocsService],
        exports: [pocs_service_1.PocsService],
    })
], PocsModule);
//# sourceMappingURL=pocs.module.js.map