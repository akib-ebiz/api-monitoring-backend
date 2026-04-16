import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ApiService } from '../api/api.service';
import { LogService } from '../log/log.service';
import { ApiDocument } from '../api/api.schema';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly logService: LogService,
  ) {}

  @Cron('*/1 * * * *') // Run every 1 minute
  async handleCron() {
    this.logger.log('Running API health checks...');
    
    const apis = await this.apiService.findAll();
    
    for (const api of apis) {
      if (!api.isActive) continue;
      
      await this.checkApi(api);
    }
  }

  private async checkApi(api: ApiDocument) {
    const start = Date.now();
    
    try {
      const response = await axios.get(api.url, {
        timeout: 30000, // 30 second timeout
        validateStatus: () => true, // Don't throw on error status codes
      });
      
      const responseTime = Date.now() - start;
      const status = response.status >= 200 && response.status < 400 ? 'success' : 'fail';
      
      await this.logService.create({
        apiId: api._id.toString(),
        status,
        responseTime,
        statusCode: response.status,
      });
      
      this.logger.log(`✅ ${api.name} - ${status} (${responseTime}ms)`);
    } catch (error) {
      const responseTime = Date.now() - start;
      
      await this.logService.create({
        apiId: api._id.toString(),
        status: 'fail',
        responseTime,
        errorMessage: error.message,
      });
      
      this.logger.error(`❌ ${api.name} - failed (${responseTime}ms): ${error.message}`);
      console.error(error);
    }
  }

  async checkApiNow(apiId: string) {
    const api = await this.apiService.findOne(apiId);
    if (!api) {
      throw new Error('API not found');
    }
    
    await this.checkApi(api);
    return this.logService.getLatestStatus(apiId);
  }
}
