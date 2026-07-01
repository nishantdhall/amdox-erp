import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PermissionRepository } from './permission.repository'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { PermissionQueryDto } from './dto/permission-query.dto'
import { PaginatedPermissions, PermissionWithRoles, PermissionResource } from './types/permission.types'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, tenantId: string): Promise<PermissionWithRoles> {
    // Check if permission already exists for this tenant
    const existingPermission = await this.permissionRepository.findByResourceAndAction(
      createPermissionDto.resource,
      createPermissionDto.action,
      tenantId,
    )

    if (existingPermission) {
      throw new ConflictException(
        `Permission for resource '${createPermissionDto.resource}' and action '${createPermissionDto.action}' already exists for this tenant`,
      )
    }

    const permission = await this.permissionRepository.create({
      ...createPermissionDto,
      tenant: { connect: { id: tenantId } },
    })

    return this.permissionRepository.findById(permission.id, tenantId) as Promise<PermissionWithRoles>
  }

  async findAll(query: PermissionQueryDto, tenantId: string): Promise<PaginatedPermissions> {
    return this.permissionRepository.findAll(query, tenantId)
  }

  async findOne(id: string, tenantId: string): Promise<PermissionWithRoles> {
    const permission = await this.permissionRepository.findById(id, tenantId)
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }
    return permission
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto, tenantId: string): Promise<PermissionWithRoles> {
    const permission = await this.permissionRepository.findById(id, tenantId)
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }

    // Check if updating resource/action and it conflicts with existing permission
    if (
      (updatePermissionDto.resource && updatePermissionDto.resource !== permission.resource) ||
      (updatePermissionDto.action && updatePermissionDto.action !== permission.action)
    ) {
      const resource = updatePermissionDto.resource || permission.resource
      const action = updatePermissionDto.action || permission.action

      const existingPermission = await this.permissionRepository.findByResourceAndAction(resource, action, tenantId)
      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Permission for resource '${resource}' and action '${action}' already exists for this tenant`,
        )
      }
    }

    // Prevent updating system permissions
    if (permission.isSystem && (updatePermissionDto.isSystem === false || updatePermissionDto.status === 'DELETED')) {
      throw new BadRequestException('System permissions cannot be modified or deleted')
    }

    await this.permissionRepository.update(id, tenantId, updatePermissionDto)
    return this.permissionRepository.findById(id, tenantId) as Promise<PermissionWithRoles>
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const permission = await this.permissionRepository.findById(id, tenantId)
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }

    // Prevent deleting system permissions
    if (permission.isSystem) {
      throw new BadRequestException('System permissions cannot be deleted')
    }

    await this.permissionRepository.softDelete(id, tenantId)
  }

  async restore(id: string, tenantId: string): Promise<PermissionWithRoles> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
    })

    if (!permission) {
      throw new NotFoundException(`Deleted permission with ID ${id} not found`)
    }

    await this.permissionRepository.restore(id, tenantId)
    return this.permissionRepository.findById(id, tenantId) as Promise<PermissionWithRoles>
  }

  async getResources(tenantId: string): Promise<string[]> {
    return this.permissionRepository.getResources(tenantId)
  }

  async getActionsByResource(resource: string, tenantId: string): Promise<string[]> {
    return this.permissionRepository.getActionsByResource(resource, tenantId)
  }

  async getGroupedPermissions(tenantId: string): Promise<PermissionResource[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        resource: true,
        action: true,
        description: true,
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })

    const grouped = permissions.reduce((acc: PermissionResource[], permission: { resource: string; action: string; description: string | null }) => {
      const existing = acc.find((item: PermissionResource) => item.resource === permission.resource)
      if (existing) {
        existing.actions.push(permission.action)
      } else {
        acc.push({
          resource: permission.resource,
          actions: [permission.action],
          description: permission.description || undefined,
        })
      }
      return acc
    }, [] as PermissionResource[])

    return grouped
  }

  async getPermissionsByRole(roleId: string, tenantId: string): Promise<any[]> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
    })

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    return this.permissionRepository.getPermissionsByRole(roleId, tenantId)
  }

  async getPermissionsByUser(userId: string, tenantId: string): Promise<any[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return this.permissionRepository.getPermissionsByUser(userId, tenantId)
  }
}