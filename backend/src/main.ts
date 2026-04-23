import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstrap the NestJS application with CORS, validation, and Swagger.
 * @returns {Promise<void>} No return
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const isProduction: boolean = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction
      ? process.env.FRONTEND_URL || 'http://localhost:3001'
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Daka Technical Assessment')
      .setDescription('The Daka Technical Assessment API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
