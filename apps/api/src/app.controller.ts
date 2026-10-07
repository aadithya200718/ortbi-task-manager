import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service and database health status',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
      },
    },
  })
  async getHealth(): Promise<{ status: string; database: string }> {
    return this.appService.getHealth();
  }
}
