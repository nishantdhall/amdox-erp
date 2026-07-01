import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'user', description: 'Resource name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  resource?: string

  @ApiPropertyOptional({ example: 'create', description: 'Action on the resource' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  action?: string

  @ApiPropertyOptional({ example: 'Create new users', description: 'Permission description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Permission status' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ example: false, description: 'Whether this is a system permission' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}