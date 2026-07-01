import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'user@company.com', description: 'User email address' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'password123', description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string

  @ApiProperty({ example: 'company123', description: 'Tenant company code' })
  @IsString()
  @IsNotEmpty()
  tenantCode!: string
}
