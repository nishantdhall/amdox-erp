import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import * as bcrypt from 'bcrypt'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const items = await this.prismaService.employee.findMany({
      include: {
        user: true,
        department: true,
      },
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
    const employee = await this.prismaService.employee.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    })

    if (!employee) {
      throw new NotFoundException('Employee not found')
    }

    return employee
  }

  async create(payload: CreateEmployeeDto): Promise<Record<string, unknown>> {
    const tenantId = await this.getDefaultTenantId()
    const passwordHash = await bcrypt.hash('Amdox@12345', 10)

    return this.prismaService.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          passwordHash,
        },
      })

      return tx.employee.create({
        data: {
          tenantId,
          userId: user.id,
          employeeCode: payload.employeeCode,
          departmentId: payload.departmentId ?? null,
          designation: payload.designation ?? null,
          phone: payload.phone ?? null,
          salary: payload.salary ?? null,
          status: 'ACTIVE',
        },
        include: {
          user: true,
          department: true,
        },
      })
    })
  }

  async update(id: string, payload: UpdateEmployeeDto): Promise<Record<string, unknown>> {
    await this.ensureExists(id)

    return this.prismaService.employee.update({
      where: { id },
      data: {
        departmentId: payload.departmentId ?? null,
        designation: payload.designation ?? null,
        phone: payload.phone ?? null,
        salary: payload.salary ?? null,
      },
      include: {
        user: true,
        department: true,
      },
    })
  }

  async remove(id: string): Promise<Record<string, string>> {
    const employee = await this.prismaService.employee.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!employee) {
      throw new NotFoundException('Employee not found')
    }

    await this.prismaService.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.employee.delete({
        where: { id },
      })
      await tx.user.delete({
        where: { id: employee.userId },
      })
    })

    return {
      message: 'Employee deleted successfully',
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const employee = await this.prismaService.employee.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!employee) {
      throw new NotFoundException('Employee not found')
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
