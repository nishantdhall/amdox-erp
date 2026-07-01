import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateAttendanceDto {
  @IsUUID()
  employeeId!: string

  @IsDateString()
  attendanceDate!: string

  @IsOptional()
  @IsDateString()
  clockIn?: string

  @IsOptional()
  @IsDateString()
  clockOut?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string
}
