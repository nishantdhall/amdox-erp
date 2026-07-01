import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<Record<string, unknown>> {
    await this.prismaService.healthCheck()

    return {
      status: 'ok',
      service: this.configService.get<string>('app.name', 'AMDOX ERP API'),
      environment: this.configService.get<string>('app.nodeEnv', 'development'),
      version: 'v1',
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      checks: {
        database: 'up',
      },
    }
  }
}
