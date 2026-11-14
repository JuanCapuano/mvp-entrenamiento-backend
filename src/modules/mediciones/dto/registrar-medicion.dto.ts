import { IsNumber, IsPositive, Max } from 'class-validator';

const MENSAJE_PESO = 'El peso corporal tiene que ser mayor a 0.';
const MENSAJE_ALTURA = 'La altura tiene que ser mayor a 0.';

// Entrada de POST /api/mediciones (Paso 11). Acá solo el formato; RN19 la vuelve a verificar el dominio.
// No lleva fecha: la pone el servidor. Los máximos son los que entran en las columnas de la base.
export class RegistrarMedicionDto {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El peso corporal (kg) admite hasta 2 decimales.' },
  )
  @IsPositive({ message: MENSAJE_PESO })
  @Max(999.99, { message: 'El peso corporal no puede superar los 999,99 kg.' })
  peso_corporal: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La altura (m) admite hasta 2 decimales.' },
  )
  @IsPositive({ message: MENSAJE_ALTURA })
  @Max(9.99, {
    message: 'La altura se carga en metros (por ejemplo, 1.76).',
  })
  altura: number;
}
