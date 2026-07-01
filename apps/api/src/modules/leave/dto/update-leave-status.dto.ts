import { IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateLeaveStatusDto {
  @IsString()
  status!: string

  @IsOptional()
  @IsUUID()
  approvedBy?: string
}
