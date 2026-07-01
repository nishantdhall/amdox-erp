import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ROLES, USER_STATUS } from '../../auth/constants/auth.constants'

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string

  @ApiProperty({ example: 'password123', description: 'Plain text password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password!: string

  @ApiPropertyOptional({ example: 'EMPLOYEE', enum: Object.values(ROLES), description: 'Primary User Role' })
  @IsOptional()
  @IsString()
  role?: string

  @ApiPropertyOptional({ example: 'ACTIVE', enum: Object.values(USER_STATUS), description: 'User status' })
  @IsOptional()
  @IsString()
  status?: string
}
