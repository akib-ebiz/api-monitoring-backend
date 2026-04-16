import { Controller, Post, Param } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { Log } from '../log/log.schema';

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('check/:apiId')
  async checkNow(@Param('apiId') apiId: string): Promise<Log> {
    return this.monitorService.checkApiNow(apiId);
  }
}
