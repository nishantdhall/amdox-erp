import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateDepartmentDto } from './dto/create-department.dto'
import { UpdateDepartmentDto } from './dto/update-department.dto'

@Injectable()
export class DepartmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const items = await this.prismaService.department.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      items,
      count: items.length,
    }
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const department = await this.prismaService.department.findUnique({
      where: { id },
    })

    if (!department) {
      throw new NotFoundException('Department not found')
    }

    return department
  }

  async create(payload: CreateDepartmentDto): Promise<Record<string, unknown>> {
    const tenantId = await this.getDefaultTenantId()

    return this.prismaService.department.create({
      data: {
        tenantId,
        name: payload.name,
        code: payload.code,
        managerId: payload.managerId ?? null,
        status: 'ACTIVE',
      },
    })
  }

  async update(id: string, payload: UpdateDepartmentDto): Promise<Record<string, unknown>> {
    await this.ensureExists(id)

    return this.prismaService.department.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        managerId: payload.managerId ?? null,
      },
    })
  }

  async remove(id: string): Promise<Record<string, string>> {
    await this.ensureExists(id)
    await this.prismaService.department.delete({
      where: { id },
    })

    return {
      message: 'Department deleted successfully',
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const department = await this.prismaService.department.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!department) {
      throw new NotFoundException('Department not found')
    }
  }

  private async getDefaultTenantId(): Promise<string> {
    const tenant = await this.prismaService.tenant.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    })

    if (!tenant) {
      throw new BadRequestException('No tenant is configured in the database')
    }

    return tenant.id
  }
}
