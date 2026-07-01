import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class UserQueryDto {
  @ApiPropertyOptional({ example: 'john', description: 'Search term for email, first name, last name' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ example: 'EMPLOYEE', description: 'Filter by primary role' })
  @IsOptional()
  @IsString()
  role?: string

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20

  @ApiPropertyOptional({ example: 'email', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({ example: 'desc', description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc'
}
