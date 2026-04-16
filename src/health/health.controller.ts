import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('health')
  health() {
    return {
      status: 'UP',
      env: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness() {
    try {
      // Check MongoDB connection
      if (this.connection.readyState === 1) {
        return {
          status: 'READY',
          services: {
            database: 'UP',
          },
        };
      } else {
        return {
          status: 'NOT_READY',
          services: {
            database: 'DOWN',
          },
        };
      }
    } catch (error) {
      return {
        status: 'NOT_READY',
        services: {
          database: 'DOWN',
        },
      };
    }
  }
}
