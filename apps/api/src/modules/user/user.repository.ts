import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { UserQueryDto } from './dto/user-query.dto'
import { PaginatedUsers, User, UserWithRoles } from './types/user.types'

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<User> {
    return this.prisma.user.create({ data }) as Promise<User>
  }

  async findById(id: string, tenantId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    }) as Promise<UserWithRoles | null>
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
    }) as Promise<User | null>
  }

  async findAll(query: UserQueryDto, tenantId: string): Promise<PaginatedUsers> {
    const { search, status, role, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query

    const where: any = {
      tenantId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: users as unknown as UserWithRoles[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update(id: string, tenantId: string, data: any): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
  }

  async softDelete(id: string, tenantId: string): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    })
  }

  async restore(id: string, tenantId: string): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    })
  }
}
