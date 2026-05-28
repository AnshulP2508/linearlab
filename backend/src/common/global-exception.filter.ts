import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpException =
      exception instanceof HttpException ? exception : undefined;
    const status = httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const body = httpException?.getResponse();

    const message =
      typeof body === 'string'
        ? body
        : typeof body === 'object' && body && 'message' in body
        ? body.message
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      JSON.stringify({
        event: 'http.exception',
        status,
        method: request.method,
        path: request.url,
        message,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

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

  private errorCodeForStatus(status: number) {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    if (status >= 500) return 'INTERNAL_ERROR';
    return 'REQUEST_FAILED';
  }
}
