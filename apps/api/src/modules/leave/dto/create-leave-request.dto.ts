import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateLeaveRequestDto {
  @IsUUID()
  employeeId!: string

  @IsString()
  leaveType!: string

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsOptional()
  @IsString()
  reason?: string
}
