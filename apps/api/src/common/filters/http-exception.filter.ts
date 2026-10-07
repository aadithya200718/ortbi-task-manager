import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export function sanitizeLogString(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    // Redact JWT tokens
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]')
    // Redact database connection strings
    .replace(/(?:postgresql|postgres|mysql|mongodb):\/\/[^@\s]+@[^/\s]+/gi, 'postgresql://[REDACTED_DB_CREDENTIALS]@***')
    // Redact bcrypt hashes
    .replace(/\$2[abxy]\$\d+\$[A-Za-z0-9./]{53}/g, '[REDACTED_HASH]')
    // Redact password/token/secret key-values
    .replace(/(["']?(?:password|passwordHash|token|secret|accessToken|authorization)["']?\s*[:=]\s*["']?)([^"'\s,}{]+)(["']?)/gi, '$1[REDACTED]$3')
    // Redact hashing <val> or password <val>
    .replace(/(hashing\s+)(\S+)/gi, '$1[REDACTED]')
    .replace(/(password\s+)(\S+)/gi, '$1[REDACTED]')
    // Redact Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
          message = 'Too many requests. Please try again later.';
          code = 'TOO_MANY_REQUESTS';
        } else {
          message = res;
          code = this.getCodeFromStatus(statusCode);
        }
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, unknown>;
        message = (errorObj.message as string | string[]) || exception.message;

        if (statusCode === HttpStatus.BAD_REQUEST) {
          code = 'VALIDATION_ERROR';
        } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
          code = 'TOO_MANY_REQUESTS';
          message = 'Too many requests. Please try again later.';
        } else if (statusCode === HttpStatus.UNAUTHORIZED) {
          code = 'UNAUTHORIZED';
        } else {
          code = (errorObj.error as string) || this.getCodeFromStatus(statusCode);
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Safe structured log for Prisma errors without exposing arguments or credentials (Repair 6 ? F7)
      const model = exception.meta?.modelName || 'Unknown';
      const target = exception.meta?.target ? JSON.stringify(exception.meta.target) : 'none';
      this.logger.error(
        `[${request.method} ${request.url}] Prisma error [${exception.code}] on model '${model}' (target: ${target})`,
      );
    } else if (exception instanceof Error) {
      // Sanitize unexpected error messages and stack traces
      const sanitizedMessage = sanitizeLogString(exception.message);
      const sanitizedStack = sanitizeLogString(exception.stack);
      this.logger.error(
        `[${request.method} ${request.url}] Unexpected exception (${exception.name}): ${sanitizedMessage}`,
        sanitizedStack,
      );
    } else {
      const sanitized = sanitizeLogString(JSON.stringify(exception));
      this.logger.error(`[${request.method} ${request.url}] Unknown exception: ${sanitized}`);
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'HTTP_ERROR';
    }
  }
}
