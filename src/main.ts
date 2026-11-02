import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Convierte el cuerpo a la clase del DTO
      whitelist: true, // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se reciben propiedades no permitidas
      errorHttpStatusCode: 422, // Código de error para validación fallida
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter()); // Manejo global de excepciones

  // Configurar prefijo para endpoints
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
