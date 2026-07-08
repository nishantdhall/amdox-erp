import { IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsUUID()
  managerId?: string
}
