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
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { TenantGuard } from '../auth/guards/tenant.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/permissions.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.type'
import { AuditLog } from '../../decorators/audit.decorator'
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermissions('users:create')
  @AuditLog({ action: 'CREATE', entityName: 'USER' })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User email already exists' })
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    const created = await this.userService.create(createUserDto, user.tenantId)
    return {
      success: true,
      message: 'User created successfully',
      data: created,
    }
  }

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get all users with pagination, search, and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: UserQueryDto, @CurrentUser() user: JwtPayload) {
    const result = await this.userService.findAll(query, user.tenantId)
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    }
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const found = await this.userService.findOne(id, user.tenantId)
    return {
      success: true,
      message: 'User retrieved successfully',
      data: found,
    }
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  @AuditLog({ action: 'UPDATE', entityName: 'USER' })
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.userService.update(id, updateUserDto, user.tenantId)
    return {
      success: true,
      message: 'User updated successfully',
      data: updated,
    }
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  @AuditLog({ action: 'DELETE', entityName: 'USER' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.userService.remove(id, user.tenantId)
  }

  @Post(':id/restore')
  @RequirePermissions('users:update')
  @AuditLog({ action: 'RESTORE', entityName: 'USER' })
  @ApiOperation({ summary: 'Restore a deleted user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deleted user not found' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const restored = await this.userService.restore(id, user.tenantId)
    return {
      success: true,
      message: 'User restored successfully',
      data: restored,
    }
  }
}
