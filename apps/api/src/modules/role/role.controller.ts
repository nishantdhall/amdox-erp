import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { RoleService } from './role.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RoleQueryDto } from './dto/role-query.dto'
import { AssignRoleDto } from './dto/assign-role.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { TenantGuard } from '../auth/guards/tenant.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/permissions.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ROLES } from '../auth/constants/auth.constants'
import { JwtPayload } from '../auth/types/jwt-payload.type'
import { AuditLog } from '../../decorators/audit.decorator'
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor'

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:create')
  @AuditLog({ action: 'CREATE', entityName: 'ROLE' })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Role created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Role code already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    const role = await this.roleService.create(createRoleDto, user.tenantId)
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    }
  }

  @Get()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all roles with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'isSystem', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Roles retrieved successfully' })
  async findAll(@Query() query: RoleQueryDto, @CurrentUser() user: JwtPayload) {
    const result = await this.roleService.findAll(query, user.tenantId)
    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: result.data,
      meta: result.meta,
    }
  }

  @Get(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const role = await this.roleService.findOne(id, user.tenantId)
    return {
      success: true,
      message: 'Role retrieved successfully',
      data: role,
    }
  }

  @Get(':id/with-relations')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get a role with all relations (permissions and users)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role with relations retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async findOneWithRelations(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const role = await this.roleService.findOneWithRelations(id, user.tenantId)
    return {
      success: true,
      message: 'Role with relations retrieved successfully',
      data: role,
    }
  }

  @Patch(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:update')
  @AuditLog({ action: 'UPDATE', entityName: 'ROLE' })
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Role code already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot modify system role' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const role = await this.roleService.update(id, updateRoleDto, user.tenantId)
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    }
  }

  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:delete')
  @AuditLog({ action: 'DELETE', entityName: 'ROLE' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role (soft delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete system role' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.roleService.remove(id, user.tenantId)
  }

  @Post(':id/restore')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:update')
  @AuditLog({ action: 'RESTORE', entityName: 'ROLE' })
  @ApiOperation({ summary: 'Restore a deleted role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deleted role not found' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const role = await this.roleService.restore(id, user.tenantId)
    return {
      success: true,
      message: 'Role restored successfully',
      data: role,
    }
  }

  @Post(':id/permissions/:permissionId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:update')
  @AuditLog({ action: 'ASSIGN_PERMISSION', entityName: 'ROLE' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Permission assigned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role or permission not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permission already assigned' })
  async assignPermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.roleService.assignPermission(roleId, permissionId, user.tenantId)
  }

  @Delete(':id/permissions/:permissionId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('roles:update')
  @AuditLog({ action: 'REMOVE_PERMISSION', entityName: 'ROLE' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Permission removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role or permission not found' })
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.roleService.removePermission(roleId, permissionId, user.tenantId)
  }

  @Post('assign')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('users:update')
  @AuditLog({ action: 'ASSIGN_ROLE', entityName: 'USER' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role assigned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or role not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Role already assigned' })
  async assignRole(@Body() assignRoleDto: AssignRoleDto, @CurrentUser() user: JwtPayload) {
    await this.roleService.assignRoleToUser(assignRoleDto, user.tenantId)
  }

  @Delete('users/:userId/roles/:roleId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('users:update')
  @AuditLog({ action: 'REMOVE_ROLE', entityName: 'USER' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role assignment not found' })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.roleService.removeRoleFromUser(userId, roleId, user.tenantId)
  }

  @Get('users/:userId/roles')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all roles assigned to a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User roles retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserRoles(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    const roles = await this.roleService.getUserRoles(userId, user.tenantId)
    return {
      success: true,
      message: 'User roles retrieved successfully',
      data: roles,
    }
  }

  @Get(':id/permissions')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all permissions assigned to a role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role permissions retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async getRolePermissions(@Param('id') roleId: string, @CurrentUser() user: JwtPayload) {
    const permissions = await this.roleService.getRolePermissions(roleId, user.tenantId)
    return {
      success: true,
      message: 'Role permissions retrieved successfully',
      data: permissions,
    }
  }
}