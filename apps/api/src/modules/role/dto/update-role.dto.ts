import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Administrator', description: 'Role name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: 'ADMIN', description: 'Role code (unique per tenant)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code?: string

  @ApiPropertyOptional({ example: 'Full system administrator role', description: 'Role description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Role status' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ example: false, description: 'Whether this is a system role' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}