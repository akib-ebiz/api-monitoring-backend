import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { LogModule } from './log/log.module';
import { MonitorModule } from './monitor/monitor.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/api-monitoring'),
    ScheduleModule.forRoot(),
    ApiModule,
    LogModule,
    MonitorModule,
    HealthModule,
  ],
})
export class AppModule {}
