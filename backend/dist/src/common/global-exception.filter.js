"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const httpException = exception instanceof common_1.HttpException ? exception : undefined;
        const status = httpException?.getStatus() ?? common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const body = httpException?.getResponse();
        const message = typeof body === 'string'
            ? body
            : typeof body === 'object' && body && 'message' in body
                ? body.message
                : exception instanceof Error
                    ? exception.message
                    : 'Internal server error';
        this.logger.error(JSON.stringify({
            event: 'http.exception',
            status,
            method: request.method,
            path: request.url,
            message,
        }), exception instanceof Error ? exception.stack : undefined);
        response.status(status).json({
            error: {
                code: this.errorCodeForStatus(status),
                message,
                statusCode: status,
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
    errorCodeForStatus(status) {
        if (status === common_1.HttpStatus.BAD_REQUEST)
            return 'VALIDATION_ERROR';
        if (status === common_1.HttpStatus.UNAUTHORIZED)
            return 'UNAUTHORIZED';
        if (status === common_1.HttpStatus.FORBIDDEN)
            return 'FORBIDDEN';
        if (status === common_1.HttpStatus.TOO_MANY_REQUESTS)
            return 'RATE_LIMITED';
        if (status >= 500)
            return 'INTERNAL_ERROR';
        return 'REQUEST_FAILED';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map