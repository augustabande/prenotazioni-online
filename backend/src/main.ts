import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');
  const allowedOrigins = (process.env['CORS_ORIGIN'] || 'http://localhost:4200')
    .split(',')
    .map(o => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());

  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Kami Kite API')
      .setDescription('Kitesurf booking platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application running on http://localhost:${port}/api`);
  Logger.log(`📚 Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();
