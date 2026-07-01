import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../../database/prisma.service'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { ROLES } from '../constants/auth.constants'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const { user } = request

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant and user information not found')
    }

    // SUPER_ADMIN bypasses all permission checks
    if (user.role === ROLES.SUPER_ADMIN) {
      return true
    }

    // Get roles assigned to user
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.sub || user.id,
        tenantId: user.tenantId,
      },
      select: {
        roleId: true,
      },
    })

    const roleIds = userRoles.map((ur: { roleId: string }) => ur.roleId)

    // Also include user's primary/default role if present in DB
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.sub || user.id, tenantId: user.tenantId },
      select: { role: true },
    })

    if (dbUser?.role === ROLES.SUPER_ADMIN) {
      return true
    }

    // Fetch matching role ID for primary role name if it's not in userRoles yet
    if (dbUser?.role) {
      const primaryRole = await this.prisma.role.findFirst({
        where: { code: dbUser.role, tenantId: user.tenantId, deletedAt: null },
        select: { id: true },
      })
      if (primaryRole && !roleIds.includes(primaryRole.id)) {
        roleIds.push(primaryRole.id)
      }
    }

    if (roleIds.length === 0) {
      throw new ForbiddenException('No roles assigned to user')
    }

    // Get permissions for these roles
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        tenantId: user.tenantId,
      },
      include: {
        permission: true,
      },
    })

    const userPermissions = rolePermissions
      .map((rp: any) => rp.permission)
      .filter((p: any) => p && p.deletedAt === null && p.status === 'ACTIVE')

    const hasPermission = requiredPermissions.every((requiredPerm) => {
      // requiredPerm is formatted as "resource:action" (e.g., "users:create")
      const [resource, action] = requiredPerm.split(':')
      return userPermissions.some(
        (p: any) =>
          p.resource.toLowerCase() === resource?.toLowerCase() &&
          p.action.toLowerCase() === action?.toLowerCase(),
      )
    })

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}
