import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { GeneratePayrollDto } from './dto/generate-payroll.dto'
import { PayrollService } from './payroll.service'

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @ResponseMessage('Payroll records retrieved successfully')
  findAll(): Promise<Record<string, unknown>> {
    return this.payrollService.findAll()
  }

  @Post('generate')
  @ResponseMessage('Payroll generated successfully')
  generate(@Body() payload: GeneratePayrollDto): Promise<Record<string, unknown>> {
    return this.payrollService.generate(payload)
  }

  @Get('employee/:employeeId')
  @ResponseMessage('Employee payroll history retrieved successfully')
  findByEmployee(@Param('employeeId') employeeId: string): Promise<Record<string, unknown>> {
    return this.payrollService.findByEmployee(employeeId)
  }
}
