import { IsEmail, IsNotEmpty, IsString, MinLength, Validate, IsOptional, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PasswordMatchConstraint } from '../validators/password-match.validator'

export class RegisterDto {
  @ApiProperty({ example: 'user@company.com', description: 'User email address' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'password123', description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  password!: string

  @ApiProperty({ example: 'password123', description: 'Confirm password' })
  @IsString()
  @Validate(PasswordMatchConstraint)
  confirmPassword!: string

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string

  @ApiProperty({ example: 'company123', description: 'Tenant company code' })
  @IsString()
  @IsNotEmpty()
  tenantCode!: string

  @ApiProperty({ example: 'EMPLOYEE', description: 'User role', required: false })
  @IsString()
  @IsOptional()
  role?: string
}
