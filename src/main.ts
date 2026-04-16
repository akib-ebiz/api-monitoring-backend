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
