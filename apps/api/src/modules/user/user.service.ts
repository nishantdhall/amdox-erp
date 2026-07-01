import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { PaginatedUsers, UserWithRoles } from './types/user.types'
import { PrismaService } from '../../database/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  private readonly saltRounds = 10

  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<UserWithRoles> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email, tenantId)
    if (existingUser) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists for this tenant`)
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds)

    const user = await this.userRepository.create({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      passwordHash,
      role: createUserDto.role || 'EMPLOYEE',
      status: createUserDto.status || 'ACTIVE',
      tenant: { connect: { id: tenantId } },
    })

    // Auto assign role in userRoles if it exists
    if (createUserDto.role) {
      const dbRole = await this.prisma.role.findFirst({
        where: { code: createUserDto.role, tenantId, deletedAt: null },
      })
      if (dbRole) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: dbRole.id,
            tenantId,
          },
        })
      }
    }

    return this.userRepository.findById(user.id, tenantId) as Promise<UserWithRoles>
  }

  async findAll(query: UserQueryDto, tenantId: string): Promise<PaginatedUsers> {
    return this.userRepository.findAll(query, tenantId)
  }

  async findOne(id: string, tenantId: string): Promise<UserWithRoles> {
    const user = await this.userRepository.findById(id, tenantId)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string): Promise<UserWithRoles> {
    const user = await this.userRepository.findById(id, tenantId)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email, tenantId)
      if (existingUser) {
        throw new ConflictException(`User with email '${updateUserDto.email}' already exists for this tenant`)
      }
    }

    const updateData: any = {
      email: updateUserDto.email,
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      role: updateUserDto.role,
      status: updateUserDto.status,
    }

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, this.saltRounds)
    }

    await this.userRepository.update(id, tenantId, updateData)

    // Handle user role sync if role is updated
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      const dbRole = await this.prisma.role.findFirst({
        where: { code: updateUserDto.role, tenantId, deletedAt: null },
      })
      if (dbRole) {
        // Clear previous userRoles matching the old role to avoid duplicates
        const oldRole = await this.prisma.role.findFirst({
          where: { code: user.role, tenantId, deletedAt: null },
        })
        if (oldRole) {
          await this.prisma.userRole.deleteMany({
            where: { userId: id, roleId: oldRole.id, tenantId },
          })
        }
        // Assign new role
        const exists = await this.prisma.userRole.findFirst({
          where: { userId: id, roleId: dbRole.id, tenantId },
        })
        if (!exists) {
          await this.prisma.userRole.create({
            data: { userId: id, roleId: dbRole.id, tenantId },
          })
        }
      }
    }

    return this.userRepository.findById(id, tenantId) as Promise<UserWithRoles>
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findById(id, tenantId)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    await this.userRepository.softDelete(id, tenantId)
  }

  async restore(id: string, tenantId: string): Promise<UserWithRoles> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
    })

    if (!user) {
      throw new NotFoundException(`Deleted user with ID ${id} not found`)
    }

    await this.userRepository.restore(id, tenantId)
    return this.userRepository.findById(id, tenantId) as Promise<UserWithRoles>
  }
}
