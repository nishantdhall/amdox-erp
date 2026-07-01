import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { Observable, map } from 'rxjs'
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Record<string, unknown>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Record<string, unknown>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [context.getHandler(), context.getClass()]) ??
      'Request completed successfully'

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message,
        data,
        requestId: this.resolveRequestId(request),
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
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
