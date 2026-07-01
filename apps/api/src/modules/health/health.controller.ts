import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { ResponseMessage } from '../../decorators/response-message.decorator'
import { HealthService } from './health.service'

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ResponseMessage('Health check retrieved successfully')
  getHealth(): Promise<Record<string, unknown>> {
    return this.healthService.getHealth()
  }
}
