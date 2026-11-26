import { IsDateString, IsOptional } from 'class-validator';

// Entrada de GET /api/sesiones?desde&hasta (US-20): los filtros tal como llegan por la URL.
// Solo valida el formato. BuscarSesionesQueryFactory lo traduce a BuscarSesionesQuery.
export class BuscarSesionesDto {
  @IsOptional()
  @IsDateString({}, { message: 'Desde debe ser una fecha válida.' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Hasta debe ser una fecha válida.' })
  hasta?: string;
}
