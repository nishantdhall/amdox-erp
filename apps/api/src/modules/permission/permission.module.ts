import { Module } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { PermissionController } from './permission.controller'
import { PermissionRepository } from './permission.repository'
import { PrismaModule } from '../../database/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
  exports: [PermissionService, PermissionRepository],
})
export class PermissionModule {}