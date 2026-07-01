import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto'

@Injectable()
export class LeaveService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const items = await this.prismaService.leaveRequest.findMany({
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

  async create(payload: CreateLeaveRequestDto): Promise<Record<string, unknown>> {
    const tenantId = await this.getDefaultTenantId()

    return this.prismaService.leaveRequest.create({
      data: {
        tenantId,
        employeeId: payload.employeeId,
        leaveType: payload.leaveType,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        reason: payload.reason ?? null,
        status: 'PENDING',
      },
    })
  }

  async updateStatus(id: string, payload: UpdateLeaveStatusDto): Promise<Record<string, unknown>> {
    return this.prismaService.leaveRequest.update({
      where: { id },
      data: {
        status: payload.status,
        approvedBy: payload.approvedBy ?? null,
      },
    })
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
