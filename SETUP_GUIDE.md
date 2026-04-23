# API Monitoring Backend - Complete Setup Guide

This guide shows how to create the API Monitoring Backend project from scratch.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (free tier)
- Git

---

## Step 1: Create NestJS Project

```bash
# Install NestJS CLI globally
npm i -g @nestjs/cli

# Create new project
nest new api-monitoring-backend
cd api-monitoring-backend
```

---

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @nestjs/mongoose @nestjs/schedule @nestjs/config @nestjs/swagger axios mongoose reflect-metadata rxjs

# Development dependencies
npm install --save-dev @nestjs/cli @nestjs/schematics @types/express @types/node typescript
```

---

## Step 3: Generate Module Structure

```bash
# API Module
nest g module api
nest g service api
nest g controller api

# Log Module
nest g module log
nest g service log
nest g controller log

# Monitor Module
nest g module monitor
nest g service monitor
nest g controller monitor

# Health Module
nest g module health
nest g controller health
```

---

## Step 4: Create Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "esModuleInterop": true
  }
}
```

### nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### package.json scripts
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main"
  }
}
```

---

## Step 5: Create Schemas

### src/api/api.schema.ts
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiDocument = Api & Document;

@Schema({ timestamps: true })
export class Api {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 1 })
  interval: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ApiSchema = SchemaFactory.createForClass(Api);
```

### src/log/log.schema.ts
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  apiId: string;

  @Prop({ required: true, enum: ['success', 'fail'] })
  status: string;

  @Prop({ required: true })
  responseTime: number;

  @Prop()
  statusCode?: number;

  @Prop()
  errorMessage?: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
```

---

## Step 6: Create Services

### src/api/api.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Api, ApiDocument } from './api.schema';

@Injectable()
export class ApiService {
  constructor(@InjectModel(Api.name) private apiModel: Model<ApiDocument>) {}

  async create(createApiDto: { url: string; name: string; interval?: number }): Promise<ApiDocument> {
    const createdApi = new this.apiModel(createApiDto);
    return createdApi.save();
  }

  async findAll(): Promise<ApiDocument[]> {
    return this.apiModel.find().exec();
  }

  async findOne(id: string): Promise<ApiDocument | null> {
    return this.apiModel.findById(id).exec();
  }

  async remove(id: string): Promise<ApiDocument | null> {
    return this.apiModel.findByIdAndDelete(id).exec();
  }
}
```

### src/log/log.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './log.schema';

@Injectable()
export class LogService {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {}

  async create(createLogDto: { apiId: string; status: string; responseTime: number; statusCode?: number; errorMessage?: string }): Promise<LogDocument> {
    const createdLog = new this.logModel(createLogDto);
    return createdLog.save();
  }

  async findAll(): Promise<LogDocument[]> {
    return this.logModel.find().sort({ timestamp: -1 }).limit(100).exec();
  }

  async findByApiId(apiId: string): Promise<LogDocument[]> {
    return this.logModel.find({ apiId }).sort({ timestamp: -1 }).limit(50).exec();
  }

  async getLatestStatus(apiId: string): Promise<LogDocument | null> {
    return this.logModel.findOne({ apiId }).sort({ timestamp: -1 }).exec();
  }
}
```

### src/monitor/monitor.service.ts
```typescript
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

  @Cron('*/1 * * * *')
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
        timeout: 30000,
        validateStatus: () => true,
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
```

### src/health/health.controller.ts
```typescript
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
```

---

## Step 7: Create Controllers

### src/api/api.controller.ts
```typescript
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiDocument } from './api.schema';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post()
  create(@Body() createApiDto: { url: string; name: string; interval?: number }) {
    return this.apiService.create(createApiDto);
  }

  @Get()
  findAll(): Promise<ApiDocument[]> {
    return this.apiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApiDocument | null> {
    return this.apiService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ApiDocument | null> {
    return this.apiService.remove(id);
  }
}
```

### src/log/log.controller.ts
```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { LogService } from './log.service';
import { LogDocument } from './log.schema';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  findAll(): Promise<LogDocument[]> {
    return this.logService.findAll();
  }

  @Get('api/:apiId')
  findByApiId(@Param('apiId') apiId: string): Promise<LogDocument[]> {
    return this.logService.findByApiId(apiId);
  }
}
```

### src/monitor/monitor.controller.ts
```typescript
import { Controller, Post, Param } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('check/:apiId')
  checkNow(@Param('apiId') apiId: string) {
    return this.monitorService.checkApiNow(apiId);
  }
}
```

---

## Step 8: Configure Modules

### src/api/api.module.ts
```typescript
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
```

### src/log/log.module.ts
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { Log, LogSchema } from './log.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
```

### src/monitor/monitor.module.ts
```typescript
import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { ApiModule } from '../api/api.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [ApiModule, LogModule],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
```

### src/health/health.module.ts
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';

@Module({
  imports: [MongooseModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### src/app.module.ts
```typescript
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
```

---

## Step 9: Configure Main Entry Point

### src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API Monitoring Dashboard')
    .setDescription('API health monitoring with cron jobs and response time tracking')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3001);
  console.log(`Server running on port ${process.env.PORT || 3001}`);
  console.log(`Swagger UI available at http://localhost:${process.env.PORT || 3001}/api-docs`);
}
bootstrap();
```

---

## Step 10: Environment Setup

### .env
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/api-monitoring
PORT=3001
NODE_ENV=development
APP_VERSION=1.0.0
```

### .env.example
```bash
MONGODB_URI=
PORT=
NODE_ENV=
APP_VERSION=
```

### .gitignore
```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
```

---

## Step 11: Run the Application

```bash
# Install dependencies
npm install

# Development mode
npm run start:dev

# Build for production
npm run build

# Production mode
npm run start:prod
```

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `@nestjs/common` | Core NestJS decorators |
| `@nestjs/core` | NestJS framework core |
| `@nestjs/mongoose` | MongoDB integration |
| `@nestjs/schedule` | Cron job scheduling |
| `@nestjs/config` | Environment configuration |
| `@nestjs/swagger` | API documentation |
| `axios` | HTTP client for API checks |
| `mongoose` | MongoDB ODM |
| `reflect-metadata` | Decorator metadata |
| `rxjs` | Reactive programming |
| `@nestjs/cli` | NestJS CLI tool |

---

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (free tier M0)
4. Create database user with username/password
5. Get connection string
6. Whitelist IP addresses (use `0.0.0.0/0` for all access)
7. Add connection string to `.env` (URL encode `@` → `%40` in password)

---

## Deployment to Render

### render.yaml
```yaml
services:
  - type: web
    name: api-monitoring-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: PORT
        value: 10000
      - key: APP_VERSION
        value: 1.0.0
```

### Render Dashboard Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/health`
- **Environment Variables:**
  - `MONGODB_URI` - Your MongoDB connection string
  - `NODE_ENV` - `production`
  - `PORT` - `10000`
  - `APP_VERSION` - `1.0.0`

---

## Common Issues & Solutions

### Issue: "nest: not found" during build
**Solution:** Move `@nestjs/cli` from `devDependencies` to `dependencies` in `package.json`

### Issue: Heap out of memory on Render
**Solution:** Use `npm run start:prod` instead of `npm run start`. The prod mode uses compiled code which is memory-efficient.

### Issue: MongoDB connection error
**Solution:** 
- Check IP whitelist in MongoDB Atlas
- URL encode special characters in password (`@` → `%40`)
- Verify connection string format

### Issue: Port already in use
**Solution:** 
- Change `PORT` in `.env` file
- Or kill process: `npx kill-port 3001`
