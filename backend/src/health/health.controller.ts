import { Controller, Get } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  @ResponseMessage('API is healthy')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'API is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2025-10-29T16:45:00.000Z' },
            uptime: { type: 'number', example: 3600 },
            database: { type: 'string', example: 'connected' },
          },
        },
      },
    },
  })
  check() {
    const dbStatus =
      this.connection.readyState === ConnectionStates.connected
        ? 'connected'
        : 'disconnected';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }
}
