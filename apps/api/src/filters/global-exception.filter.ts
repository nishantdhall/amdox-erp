import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AppLogger } from '../common/logger/app.logger'

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const reply = context.getResponse<FastifyReply>()
    const request = context.getRequest<FastifyRequest>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const response = exception instanceof HttpException ? exception.getResponse() : null
    const payload = this.normalizeException(response, exception)
    const requestId = this.resolveRequestId(request)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.errorHttp('unhandled_exception', exception, {
        requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
      })
    } else {
      this.logger.warnHttp('handled_exception', {
        requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
        error: payload.error,
      })
    }

    reply.status(status).send({
      success: false,
      message: payload.message,
      error: payload.error,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private normalizeException(response: unknown, exception: unknown): { message: string; error: unknown } {
    if (typeof response === 'string') {
      return { message: response, error: response }
    }

    if (response && typeof response === 'object') {
      const payload = response as Record<string, unknown>
      return {
        message: typeof payload.message === 'string' ? payload.message : 'Request failed',
        error: payload.errors ?? payload.error ?? payload.message ?? payload,
      }
    }

    if (exception instanceof Error) {
      return { message: exception.message, error: exception.message }
    }

    return { message: 'Internal server error', error: 'Internal server error' }
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
