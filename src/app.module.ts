import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { LogModule } from './log/log.module';
import { MonitorModule } from './monitor/monitor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/api-monitoring'),
    ScheduleModule.forRoot(),
    ApiModule,
    LogModule,
    MonitorModule,
  ],
})
export class AppModule {}
