import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, tap } from 'rxjs'
import { AuditLogService } from '../modules/audit/audit-log.service'
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit.decorator'

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler()
    const className = context.getClass()

    const options = this.reflector.getAllAndOverride<AuditLogOptions>(AUDIT_LOG_KEY, [handler, className])

    if (!options) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    return next.handle().pipe(
      tap({
        next: async (response) => {
          if (user && user.tenantId) {
            const userId = user.sub || user.id
            const tenantId = user.tenantId

            // Try to extract entity ID from response or path parameters
            const entityId = response?.id || response?.data?.id || request.params?.id

            // Clean request body from sensitive fields
            let newValue = request.body ? { ...request.body } : null
            if (newValue) {
              const sensitiveFields = ['password', 'passwordHash', 'refreshToken', 'token']
              for (const field of sensitiveFields) {
                if (field in newValue) {
                  delete newValue[field]
                }
              }
            }

            await this.auditLogService.log({
              tenantId,
              userId,
              entityName: options.entityName,
              entityId: entityId ? String(entityId) : null,
              action: options.action,
              oldValue: null,
              newValue,
            })
          }
        },
      }),
    )
  }
}
