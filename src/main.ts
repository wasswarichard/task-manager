import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Application bootstrap.
 *
 * - Registers a global ValidationPipe to enforce DTO validation across the app
 *   (whitelisting properties, forbidding unknown fields, and enabling type
 *   transformation via class-transformer).
 * - Sets up Swagger/OpenAPI documentation with JWT Bearer support.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (OpenAPI) setup
  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription(
      'REST API for managing tasks and assignments. Auth endpoints are public; other endpoints require JWT Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(3000);
}
bootstrap();
