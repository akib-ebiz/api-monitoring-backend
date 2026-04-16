import { Controller, Get, Param } from '@nestjs/common';
import { LogService } from './log.service';
import { Log } from './log.schema';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  async findAll(): Promise<Log[]> {
    return this.logService.findAll();
  }

  @Get('api/:apiId')
  async findByApiId(@Param('apiId') apiId: string): Promise<Log[]> {
    return this.logService.findByApiId(apiId);
  }
}
