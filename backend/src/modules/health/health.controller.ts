import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @ApiOperation({ summary: 'API Root Health Check' })
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'RestaurantOS REST API',
      version: '1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Health Status Endpoint' })
  @Get('health')
  getHealthStatus() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
