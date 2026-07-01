import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { RoleQueryDto } from './dto/role-query.dto'
import { PaginatedRoles, Role, RoleWithPermissions, RoleWithRelations } from './types/role.types'

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.role.create({ data })
  }

  async findById(id: string, tenantId: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    }) as Promise<RoleWithPermissions | null>
  }

  async findByCode(code: string, tenantId: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { code, tenantId, deletedAt: null },
    }) as Promise<Role | null>
  }

  async findAll(query: RoleQueryDto, tenantId: string): Promise<PaginatedRoles> {
    const { search, status, isSystem, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query

    const where: any = {
      tenantId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (isSystem !== undefined) {
      where.isSystem = isSystem
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.role.count({ where }),
    ])

    return {
      data: roles as unknown as RoleWithPermissions[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update(id: string, tenantId: string, data: any): Promise<any> {
    return this.prisma.role.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
  }

  async softDelete(id: string, tenantId: string): Promise<any> {
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    })
  }

  async restore(id: string, tenantId: string): Promise<any> {
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    })
  }

  async findWithRelations(id: string, tenantId: string): Promise<RoleWithRelations | null> {
    return this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }) as Promise<RoleWithRelations | null>
  }

  async assignPermission(roleId: string, permissionId: string, tenantId: string): Promise<void> {
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        tenantId,
      },
    })
  }

  async removePermission(roleId: string, permissionId: string, tenantId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
        tenantId,
      },
    })
  }

  async assignToUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        tenantId,
      },
    })
  }

  async removeFromUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
        tenantId,
      },
    })
  }

  async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, tenantId },
      include: {
        role: true,
      },
    })

    return userRoles.map((ur: any) => ur.role)
  }

  async getRolePermissions(roleId: string, tenantId: string): Promise<any[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId, tenantId },
      include: {
        permission: true,
      },
    })

    return rolePermissions.map((rp: any) => rp.permission)
  }
}