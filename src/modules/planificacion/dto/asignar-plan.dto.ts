import { IsInt, IsString, Matches } from 'class-validator';

const MENSAJE_FECHA =
  'Las fechas de la vigencia tienen que tener el formato AAAA-MM-DD.';

// Entrada de POST /api/planes/{id}/asignaciones (Paso 11). Acá solo el formato; las reglas
// (RN10, RN11, RN14) las verifica el dominio.
export class AsignarPlanDto {
  @IsInt({ message: 'El deportista_id tiene que ser un número entero.' })
  deportista_id: number;

  @IsString({ message: MENSAJE_FECHA })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MENSAJE_FECHA })
  vigencia_desde: string;

  @IsString({ message: MENSAJE_FECHA })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MENSAJE_FECHA })
  vigencia_hasta: string;
}
