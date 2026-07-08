import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'
import { EmployeesService } from './employees.service'

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ResponseMessage('Employees retrieved successfully')
  findAll(): Promise<Record<string, unknown>> {
    return this.employeesService.findAll()
  }

  @Get(':id')
  @ResponseMessage('Employee retrieved successfully')
  findOne(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.employeesService.findOne(id)
  }

  @Post()
  @ResponseMessage('Employee created successfully')
  create(@Body() payload: CreateEmployeeDto): Promise<Record<string, unknown>> {
    return this.employeesService.create(payload)
  }

  @Put(':id')
  @ResponseMessage('Employee updated successfully')
  update(@Param('id') id: string, @Body() payload: UpdateEmployeeDto): Promise<Record<string, unknown>> {
    return this.employeesService.update(id, payload)
  }

  @Delete(':id')
  @ResponseMessage('Employee deleted successfully')
  remove(@Param('id') id: string): Promise<Record<string, string>> {
    return this.employeesService.remove(id)
  }
}
