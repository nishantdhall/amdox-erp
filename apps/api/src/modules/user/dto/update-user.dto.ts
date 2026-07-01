import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newpassword123', description: 'New plain text password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  override password?: string
}
