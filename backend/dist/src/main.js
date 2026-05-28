"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const express_1 = require("express");
const global_exception_filter_1 = require("./common/global-exception.filter");
const app_module_1 = require("./app.module");
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
async function bootstrap() {
    getRequiredEnv('JWT_SECRET');
    getRequiredEnv('DATABASE_URL');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const requestBodyLimit = '16mb';
    app.setGlobalPrefix('api/v1');
    app.use((0, helmet_1.default)());
    app.use((0, express_1.json)({ limit: requestBodyLimit }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: requestBodyLimit }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    });
    app.enableShutdownHooks();
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map