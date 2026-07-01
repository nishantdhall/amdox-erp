import { Type } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string

  @IsString()
  @IsNotEmpty()
  lastName!: string

  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  employeeCode!: string

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
