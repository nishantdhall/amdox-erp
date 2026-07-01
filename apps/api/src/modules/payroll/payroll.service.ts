import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { GeneratePayrollDto } from './dto/generate-payroll.dto'

@Injectable()
export class PayrollService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const items = await this.prismaService.payroll.findMany({
      include: {
        employee: {
          include: {
            user: true,
          },
        },
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

  async generate(payload: GeneratePayrollDto): Promise<Record<string, unknown>> {
    const tenantId = await this.getDefaultTenantId()
    const allowances = payload.allowances ?? 0
    const deductions = payload.deductions ?? 0
    const taxAmount = this.roundCurrency(payload.basicSalary * 0.1)
    const netSalary = this.roundCurrency(payload.basicSalary + allowances - deductions - taxAmount)

    return this.prismaService.payroll.create({
      data: {
        tenantId,
        employeeId: payload.employeeId,
        payrollMonth: payload.payrollMonth,
        basicSalary: payload.basicSalary,
        allowances,
        deductions,
        taxAmount,
        netSalary,
        status: 'GENERATED',
      },
    })
  }

  async findByEmployee(employeeId: string): Promise<Record<string, unknown>> {
    const items = await this.prismaService.payroll.findMany({
      where: {
        employeeId,
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

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2))
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
