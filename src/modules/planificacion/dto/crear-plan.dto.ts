import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const MENSAJE_ORDEN =
  'El orden de los ejercicios tiene que ser correlativo, empezando en 1.';
const MENSAJE_REPS = 'Las repeticiones tienen que ser mayores a 0.';

// Entrada de POST /api/planes (Paso 11). Acá solo el formato; las reglas de negocio
// (RN10, RN15) las vuelve a verificar el dominio.
export class DosificacionDto {
  @IsInt({ message: 'El ejercicio_id tiene que ser un número entero.' })
  ejercicio_id: number;

  @IsInt({ message: MENSAJE_ORDEN })
  @Min(1, { message: MENSAJE_ORDEN })
  orden: number;

  @IsInt({ message: 'Las series objetivo tienen que ser 1 o más.' })
  @Min(1, { message: 'Las series objetivo tienen que ser 1 o más.' })
  series_objetivo: number;

  @IsInt({ message: MENSAJE_REPS })
  @Min(1, { message: MENSAJE_REPS })
  reps_min: number;

  @IsInt({ message: MENSAJE_REPS })
  @Min(1, { message: MENSAJE_REPS })
  reps_max: number;

  @IsInt({ message: 'El RIR objetivo no puede ser negativo.' })
  @Min(0, { message: 'El RIR objetivo no puede ser negativo.' })
  rir_objetivo: number;
}

export class RutinaDto {
  @IsString({ message: 'La rutina tiene que tener un nombre.' })
  @Transform(recortar)
  @IsNotEmpty({ message: 'La rutina tiene que tener un nombre.' })
  nombre: string;

  @IsArray({ message: 'La rutina tiene que tener al menos un ejercicio.' })
  @ArrayMinSize(1, {
    message: 'La rutina tiene que tener al menos un ejercicio.',
  })
  @ValidateNested({ each: true })
  @Type(() => DosificacionDto)
  dosificaciones: DosificacionDto[];
}

export class CrearPlanDto {
  @IsString({ message: 'El plan tiene que tener un nombre.' })
  @Transform(recortar)
  @IsNotEmpty({ message: 'El plan tiene que tener un nombre.' })
  nombre: string;

  // Opcionales (US-06)
  @IsOptional()
  @IsString({ message: 'Las indicaciones tienen que ser un texto.' })
  indicaciones?: string;

  @IsArray({ message: 'El plan tiene que tener al menos una rutina.' })
  @ArrayMinSize(1, { message: 'El plan tiene que tener al menos una rutina.' })
  @ValidateNested({ each: true })
  @Type(() => RutinaDto)
  rutinas: RutinaDto[];
}
