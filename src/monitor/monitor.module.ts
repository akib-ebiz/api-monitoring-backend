import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { ApiModule } from '../api/api.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [ApiModule, LogModule],
  providers: [MonitorService],
  controllers: [MonitorController],
})
export class MonitorModule {}
