import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// QueryObject de GET /api/sesiones/hoy?rutina_id=1
export class SesionDeHoyQuery {
  @Type(() => Number)
  @IsInt({ message: 'La rutina debe ser un identificador entero.' })
  @Min(1, { message: 'La rutina debe ser un identificador positivo.' })
  rutina_id: number;
}
