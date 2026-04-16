import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { Api, ApiSchema } from './api.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Api.name, schema: ApiSchema }])],
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}
