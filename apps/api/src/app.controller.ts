import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'AMDOX ERP API',
      timestamp: new Date().toISOString(),
    };
  }
}
