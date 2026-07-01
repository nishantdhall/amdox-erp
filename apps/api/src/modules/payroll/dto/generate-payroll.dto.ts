import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

export class GeneratePayrollDto {
  @IsUUID()
  employeeId!: string

  @IsString()
  @IsNotEmpty()
  payrollMonth!: string

  @Type(() => Number)
  @IsNumber()
  basicSalary!: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  allowances?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deductions?: number
}
