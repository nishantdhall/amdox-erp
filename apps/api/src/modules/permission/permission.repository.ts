import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { PermissionQueryDto } from './dto/permission-query.dto'
import { PaginatedPermissions, Permission, PermissionWithRoles } from './types/permission.types'

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.permission.create({ data })
  }

  async findById(id: string, tenantId: string): Promise<PermissionWithRoles | null> {
    return this.prisma.permission.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    }) as Promise<PermissionWithRoles | null>
  }

  async findByResourceAndAction(resource: string, action: string, tenantId: string): Promise<Permission | null> {
    return this.prisma.permission.findFirst({
      where: { resource, action, tenantId, deletedAt: null },
    }) as Promise<Permission | null>
  }

  async findAll(query: PermissionQueryDto, tenantId: string): Promise<PaginatedPermissions> {
    const {
      search,
      status,
      resource,
      action,
      isSystem,
      page = 1,
      limit = 20,
      sortBy = 'resource',
      sortOrder = 'asc',
    } = query

    const where: any = {
      tenantId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (resource) {
      where.resource = resource
    }

    if (action) {
      where.action = action
    }

    if (isSystem !== undefined) {
      where.isSystem = isSystem
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        include: {
          rolePermissions: {
            include: {
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.permission.count({ where }),
    ])

    return {
      data: permissions as unknown as PermissionWithRoles[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update(id: string, tenantId: string, data: any): Promise<any> {
    return this.prisma.permission.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
  }

  async softDelete(id: string, tenantId: string): Promise<any> {
    return this.prisma.permission.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    })
  }

  async restore(id: string, tenantId: string): Promise<any> {
    return this.prisma.permission.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    })
  }

  async getResources(tenantId: string): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { tenantId, deletedAt: null },
      select: { resource: true },
      distinct: ['resource'],
    })

    return permissions.map((p: any) => p.resource)
  }

  async getActionsByResource(resource: string, tenantId: string): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { resource, tenantId, deletedAt: null },
      select: { action: true },
    })

    return permissions.map((p: any) => p.action)
  }

  async getPermissionsByRole(roleId: string, tenantId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId, tenantId },
      include: {
        permission: true,
      },
    })

    return rolePermissions.map((rp: any) => rp.permission)
  }

  async getPermissionsByUser(userId: string, tenantId: string): Promise<Permission[]> {
    // Get user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, tenantId },
      select: { roleId: true },
    })

    if (userRoles.length === 0) {
      return []
    }

    const roleIds = userRoles.map((ur: any) => ur.roleId)

    // Get permissions for all roles
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        tenantId,
      },
      include: {
        permission: true,
      },
    })

    // Remove duplicates (same permission assigned to multiple roles)
    const permissionMap = new Map<string, Permission>()
    rolePermissions.forEach((rp: any) => {
      permissionMap.set(rp.permissionId, rp.permission)
    })

    return Array.from(permissionMap.values())
  }
}