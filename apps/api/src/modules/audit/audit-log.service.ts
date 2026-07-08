import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AuditLog } from '@prisma/client'

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    tenantId: string
    userId: string
    entityName: string
    entityId?: string | null
    action: string
    oldValue?: any
    newValue?: any
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        entityName: data.entityName,
        entityId: data.entityId ?? null,
        action: data.action,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
      },
    })
  }

  async findAll(query: {
    tenantId: string
    userId?: string
    entityName?: string
    action?: string
    page?: number
    limit?: number
  }) {
    const { tenantId, userId, entityName, action, page = 1, limit = 20 } = query

    const where: any = { tenantId }
    if (userId) where.userId = userId
    if (entityName) where.entityName = entityName
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
