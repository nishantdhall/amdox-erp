import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateEmployeeDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string

  @IsOptional()
  @IsString()
  designation?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number
}
