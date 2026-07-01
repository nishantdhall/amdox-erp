import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class PermissionQueryDto {
  @ApiPropertyOptional({ example: 'user', description: 'Search term for resource, action or description' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ example: 'user', description: 'Filter by resource' })
  @IsOptional()
  @IsString()
  resource?: string

  @ApiPropertyOptional({ example: 'create', description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string

  @ApiPropertyOptional({ example: true, description: 'Filter by system permissions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSystem?: boolean

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20

  @ApiPropertyOptional({ example: 'resource', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'resource'

  @ApiPropertyOptional({ example: 'asc', description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc'
}