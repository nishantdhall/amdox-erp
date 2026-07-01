import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateAttendanceDto } from './dto/create-attendance.dto'

@Injectable()
export class AttendanceService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const items = await this.prismaService.attendance.findMany({
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    })

    return {
      items,
      count: items.length,
    }
  }

  async create(payload: CreateAttendanceDto): Promise<Record<string, unknown>> {
    const tenantId = await this.getDefaultTenantId()

    return this.prismaService.attendance.create({
      data: {
        tenantId,
        employeeId: payload.employeeId,
        attendanceDate: new Date(payload.attendanceDate),
        clockIn: payload.clockIn ? new Date(payload.clockIn) : null,
        clockOut: payload.clockOut ? new Date(payload.clockOut) : null,
        status: payload.status ?? 'PRESENT',
      },
    })
  }

  async findByEmployee(employeeId: string): Promise<Record<string, unknown>> {
    const items = await this.prismaService.attendance.findMany({
      where: {
        employeeId,
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    })

    return {
      items,
      count: items.length,
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
