import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto'
import { LeaveService } from './leave.service'

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  @ResponseMessage('Leave requests retrieved successfully')
  findAll(): Promise<Record<string, unknown>> {
    return this.leaveService.findAll()
  }

  @Post()
  @ResponseMessage('Leave request created successfully')
  create(@Body() payload: CreateLeaveRequestDto): Promise<Record<string, unknown>> {
    return this.leaveService.create(payload)
  }

  @Put(':id/status')
  @ResponseMessage('Leave request status updated successfully')
  updateStatus(@Param('id') id: string, @Body() payload: UpdateLeaveStatusDto): Promise<Record<string, unknown>> {
    return this.leaveService.updateStatus(id, payload)
  }
}
