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
import { PermissionService } from './permission.service'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { PermissionQueryDto } from './dto/permission-query.dto'
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

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('permissions:create')
  @AuditLog({ action: 'CREATE', entityName: 'PERMISSION' })
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Permission created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permission already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async create(@Body() createPermissionDto: CreatePermissionDto, @CurrentUser() user: JwtPayload) {
    const permission = await this.permissionService.create(createPermissionDto, user.tenantId)
    return {
      success: true,
      message: 'Permission created successfully',
      data: permission,
    }
  }

  @Get()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'isSystem', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permissions retrieved successfully' })
  async findAll(@Query() query: PermissionQueryDto, @CurrentUser() user: JwtPayload) {
    const result = await this.permissionService.findAll(query, user.tenantId)
    return {
      success: true,
      message: 'Permissions retrieved successfully',
      data: result.data,
      meta: result.meta,
    }
  }

  @Get(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const permission = await this.permissionService.findOne(id, user.tenantId)
    return {
      success: true,
      message: 'Permission retrieved successfully',
      data: permission,
    }
  }

  @Patch(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('permissions:update')
  @AuditLog({ action: 'UPDATE', entityName: 'PERMISSION' })
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permission updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permission already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot modify system permission' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const permission = await this.permissionService.update(id, updatePermissionDto, user.tenantId)
    return {
      success: true,
      message: 'Permission updated successfully',
      data: permission,
    }
  }

  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('permissions:delete')
  @AuditLog({ action: 'DELETE', entityName: 'PERMISSION' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission (soft delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Permission deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete system permission' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.permissionService.remove(id, user.tenantId)
  }

  @Post(':id/restore')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @RequirePermissions('permissions:update')
  @AuditLog({ action: 'RESTORE', entityName: 'PERMISSION' })
  @ApiOperation({ summary: 'Restore a deleted permission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permission restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deleted permission not found' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const permission = await this.permissionService.restore(id, user.tenantId)
    return {
      success: true,
      message: 'Permission restored successfully',
      data: permission,
    }
  }

  @Get('resources/list')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all unique resource names' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resources retrieved successfully' })
  async getResources(@CurrentUser() user: JwtPayload) {
    const resources = await this.permissionService.getResources(user.tenantId)
    return {
      success: true,
      message: 'Resources retrieved successfully',
      data: resources,
    }
  }

  @Get('resources/:resource/actions')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all actions for a specific resource' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Actions retrieved successfully' })
  async getActionsByResource(@Param('resource') resource: string, @CurrentUser() user: JwtPayload) {
    const actions = await this.permissionService.getActionsByResource(resource, user.tenantId)
    return {
      success: true,
      message: 'Actions retrieved successfully',
      data: actions,
    }
  }

  @Get('grouped')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get permissions grouped by resource' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Grouped permissions retrieved successfully' })
  async getGroupedPermissions(@CurrentUser() user: JwtPayload) {
    const grouped = await this.permissionService.getGroupedPermissions(user.tenantId)
    return {
      success: true,
      message: 'Grouped permissions retrieved successfully',
      data: grouped,
    }
  }

  @Get('roles/:roleId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions assigned to a role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role permissions retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async getPermissionsByRole(@Param('roleId') roleId: string, @CurrentUser() user: JwtPayload) {
    const permissions = await this.permissionService.getPermissionsByRole(roleId, user.tenantId)
    return {
      success: true,
      message: 'Role permissions retrieved successfully',
      data: permissions,
    }
  }

  @Get('users/:userId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions assigned to a user (through roles)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User permissions retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getPermissionsByUser(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    const permissions = await this.permissionService.getPermissionsByUser(userId, user.tenantId)
    return {
      success: true,
      message: 'User permissions retrieved successfully',
      data: permissions,
    }
  }
}