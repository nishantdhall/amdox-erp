import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { RoleRepository } from './role.repository'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RoleQueryDto } from './dto/role-query.dto'
import { AssignRoleDto } from './dto/assign-role.dto'
import { PaginatedRoles, RoleWithPermissions, RoleWithRelations } from './types/role.types'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createRoleDto: CreateRoleDto, tenantId: string): Promise<RoleWithPermissions> {
    // Check if role code already exists for this tenant
    const existingRole = await this.roleRepository.findByCode(createRoleDto.code, tenantId)
    if (existingRole) {
      throw new ConflictException(`Role with code '${createRoleDto.code}' already exists for this tenant`)
    }

    const role = await this.roleRepository.create({
      ...createRoleDto,
      tenant: { connect: { id: tenantId } },
    })

    return this.roleRepository.findById(role.id, tenantId) as Promise<RoleWithPermissions>
  }

  async findAll(query: RoleQueryDto, tenantId: string): Promise<PaginatedRoles> {
    return this.roleRepository.findAll(query, tenantId)
  }

  async findOne(id: string, tenantId: string): Promise<RoleWithPermissions> {
    const role = await this.roleRepository.findById(id, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }
    return role
  }

  async findOneWithRelations(id: string, tenantId: string): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findWithRelations(id, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }
    return role
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string): Promise<RoleWithPermissions> {
    const role = await this.roleRepository.findById(id, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }

    // Check if updating code and it conflicts with existing role
    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existingRole = await this.roleRepository.findByCode(updateRoleDto.code, tenantId)
      if (existingRole) {
        throw new ConflictException(`Role with code '${updateRoleDto.code}' already exists for this tenant`)
      }
    }

    // Prevent updating system roles
    if (role.isSystem && (updateRoleDto.isSystem === false || updateRoleDto.status === 'DELETED')) {
      throw new BadRequestException('System roles cannot be modified or deleted')
    }

    await this.roleRepository.update(id, tenantId, updateRoleDto)
    return this.roleRepository.findById(id, tenantId) as Promise<RoleWithPermissions>
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findById(id, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted')
    }

    await this.roleRepository.softDelete(id, tenantId)
  }

  async restore(id: string, tenantId: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
    })

    if (!role) {
      throw new NotFoundException(`Deleted role with ID ${id} not found`)
    }

    await this.roleRepository.restore(id, tenantId)
    return this.roleRepository.findById(id, tenantId) as Promise<RoleWithPermissions>
  }

  async assignPermission(roleId: string, permissionId: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findById(roleId, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    const permission = await this.prisma.permission.findFirst({
      where: { id: permissionId, tenantId, deletedAt: null },
    })

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`)
    }

    // Check if permission is already assigned
    const existingAssignment = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId, tenantId },
    })

    if (existingAssignment) {
      throw new ConflictException('Permission is already assigned to this role')
    }

    await this.roleRepository.assignPermission(roleId, permissionId, tenantId)
  }

  async removePermission(roleId: string, permissionId: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findById(roleId, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    const permission = await this.prisma.permission.findFirst({
      where: { id: permissionId, tenantId, deletedAt: null },
    })

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`)
    }

    await this.roleRepository.removePermission(roleId, permissionId, tenantId)
  }

  async assignRoleToUser(assignRoleDto: AssignRoleDto, tenantId: string): Promise<void> {
    const { userId, roleId } = assignRoleDto

    // Check if user exists and belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    // Check if role exists and belongs to tenant
    const role = await this.roleRepository.findById(roleId, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    // Check if role is already assigned to user
    const existingAssignment = await this.prisma.userRole.findFirst({
      where: { userId, roleId, tenantId },
    })

    if (existingAssignment) {
      throw new ConflictException('Role is already assigned to this user')
    }

    await this.roleRepository.assignToUser(userId, roleId, tenantId)
  }

  async removeRoleFromUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    // Check if assignment exists
    const assignment = await this.prisma.userRole.findFirst({
      where: { userId, roleId, tenantId },
    })

    if (!assignment) {
      throw new NotFoundException('Role is not assigned to this user')
    }

    await this.roleRepository.removeFromUser(userId, roleId, tenantId)
  }

  async getUserRoles(userId: string, tenantId: string): Promise<any[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return this.roleRepository.getUserRoles(userId, tenantId)
  }

  async getRolePermissions(roleId: string, tenantId: string): Promise<any[]> {
    const role = await this.roleRepository.findById(roleId, tenantId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    return this.roleRepository.getRolePermissions(roleId, tenantId)
  }
}