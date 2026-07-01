import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { CreateDepartmentDto } from './dto/create-department.dto'
import { UpdateDepartmentDto } from './dto/update-department.dto'
import { DepartmentsService } from './departments.service'

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ResponseMessage('Departments retrieved successfully')
  findAll(): Promise<Record<string, unknown>> {
    return this.departmentsService.findAll()
  }

  @Get(':id')
  @ResponseMessage('Department retrieved successfully')
  findOne(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.departmentsService.findOne(id)
  }

  @Post()
  @ResponseMessage('Department created successfully')
  create(@Body() payload: CreateDepartmentDto): Promise<Record<string, unknown>> {
    return this.departmentsService.create(payload)
  }

  @Put(':id')
  @ResponseMessage('Department updated successfully')
  update(@Param('id') id: string, @Body() payload: UpdateDepartmentDto): Promise<Record<string, unknown>> {
    return this.departmentsService.update(id, payload)
  }

  @Delete(':id')
  @ResponseMessage('Department deleted successfully')
  remove(@Param('id') id: string): Promise<Record<string, string>> {
    return this.departmentsService.remove(id)
  }
}
