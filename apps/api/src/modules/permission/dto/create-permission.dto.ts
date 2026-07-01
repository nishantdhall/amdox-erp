import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreatePermissionDto {
  @ApiProperty({ example: 'user', description: 'Resource name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  resource!: string

  @ApiProperty({ example: 'create', description: 'Action on the resource' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  action!: string

  @ApiPropertyOptional({ example: 'Create new users', description: 'Permission description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional({ example: false, description: 'Whether this is a system permission' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}