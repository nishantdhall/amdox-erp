import { IsNotEmpty, IsString, MinLength, Matches, Validate } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PasswordMatchConstraint } from '../validators/password-match.validator'

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string

  @ApiProperty({ example: 'newPassword123', description: 'New password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  newPassword!: string

  @ApiProperty({ example: 'newPassword123', description: 'Confirm new password' })
  @IsString()
  @Validate(PasswordMatchConstraint, ['newPassword'])
  confirmNewPassword!: string
}