import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const { method, originalUrl } = req;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const status =
            err instanceof Object && 'getStatus' in err && typeof (err as { getStatus: () => number }).getStatus === 'function'
              ? (err as { getStatus: () => number }).getStatus()
              : 500;
          this.logger.error(`${method} ${originalUrl} ${status} - ${duration}ms`);
        },
      }),
    );
  }
}