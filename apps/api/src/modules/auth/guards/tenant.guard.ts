import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma.service'
import { TENANT_STATUS } from '../constants/auth.constants'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const { user } = request

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant information not found')
    }

    // Check if tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    })

    if (!tenant) {
      throw new ForbiddenException('Tenant not found')
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new ForbiddenException('Tenant is inactive')
    }

    // Attach tenant to request for later use
    request.tenant = tenant

    return true
  }
}