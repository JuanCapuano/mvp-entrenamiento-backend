import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// QueryObject: filtros de GET /api/mediciones, todos opcionales
// (?deportista_id=3&desde=2026-10-01&hasta=2026-10-31)
export class MedicionesQuery {
  // Solo lo manda el entrenador, para ver a un deportista vinculado
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El deportista_id tiene que ser un número entero.' })
  @Min(1, { message: 'El deportista_id tiene que ser un número entero.' })
  deportista_id?: number;

  @IsOptional()
  @Matches(FECHA_ISO, {
    message: 'La fecha desde tiene que tener el formato AAAA-MM-DD.',
  })
  desde?: string;

  @IsOptional()
  @Matches(FECHA_ISO, {
    message: 'La fecha hasta tiene que tener el formato AAAA-MM-DD.',
  })
  hasta?: string;
}
