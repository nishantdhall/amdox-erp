import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Observable, catchError, tap, throwError } from 'rxjs'
import { AppLogger } from '../common/logger/app.logger'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()
    const startedAt = Date.now()
    const requestId = this.resolveRequestId(request)

    return next.handle().pipe(
      tap(() => {
        this.logger.logHttp('request_completed', {
          requestId,
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        })
      }),
      catchError((error: unknown) => {
        this.logger.errorHttp('request_failed', error, {
          requestId,
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        })

        return throwError(() => error)
      }),
    )
  }

  private resolveRequestId(request: FastifyRequest): string {
    const headerValue = request.headers['x-request-id']

    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue
    }

    if (Array.isArray(headerValue) && headerValue.length > 0) {
      return headerValue[0] ?? request.id
    }

    return request.id
  }
}
