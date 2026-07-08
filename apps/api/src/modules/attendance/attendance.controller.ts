import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { AttendanceService } from './attendance.service'
import { CreateAttendanceDto } from './dto/create-attendance.dto'

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ResponseMessage('Attendance records retrieved successfully')
  findAll(): Promise<Record<string, unknown>> {
    return this.attendanceService.findAll()
  }

  @Post()
  @ResponseMessage('Attendance created successfully')
  create(@Body() payload: CreateAttendanceDto): Promise<Record<string, unknown>> {
    return this.attendanceService.create(payload)
  }

  @Get('employee/:employeeId')
  @ResponseMessage('Employee attendance retrieved successfully')
  findByEmployee(@Param('employeeId') employeeId: string): Promise<Record<string, unknown>> {
    return this.attendanceService.findByEmployee(employeeId)
  }
}
