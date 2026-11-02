import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Convierte cualquier error al formato del contrato (paso 11): { "error": "mensaje legible" }
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    // Errores conocidos: los que lanzamos nosotros (NotFound, Conflict, etc.) y los del ValidationPipe
    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json({ error: this.obtenerMensaje(exception) });
      return;
    }

    // Errores no previstos (base caída, bug): se loguean completos y al cliente no se le dan detalles
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error interno del servidor.' });
  }

  private obtenerMensaje(exception: HttpException): string {
    const body = exception.getResponse();

    if (typeof body === 'string') return body;

    const message = (body as { message?: string | string[] }).message;

    // El ValidationPipe devuelve un array con un mensaje por cada regla que falló
    if (Array.isArray(message)) return message.join(' ');

    return message ?? exception.message;
  }
}
