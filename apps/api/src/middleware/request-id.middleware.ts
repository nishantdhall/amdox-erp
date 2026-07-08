import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { IncomingMessage, ServerResponse } from 'node:http'

interface RequestWithId extends IncomingMessage {
  requestId?: string
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: ServerResponse, next: () => void): void {
    const headerValue = request.headers['x-request-id']
    const requestId = Array.isArray(headerValue)
      ? (headerValue[0] ?? randomUUID())
      : (headerValue ?? randomUUID())

    request.requestId = requestId
    response.setHeader('x-request-id', requestId)
    next()
  }
}
