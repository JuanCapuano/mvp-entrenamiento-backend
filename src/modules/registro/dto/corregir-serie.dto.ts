import { IsInt, IsNumber, Min } from 'class-validator';

// Entrada de PATCH /api/series/{id} (Paso 11): mismos valores y mensajes que al registrar.
// No lleva fecha, número ni ejercicio: la serie conserva los suyos.
export class CorregirSerieDto {
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'El peso debe ser un número con hasta 2 decimales.' },
  )
  @Min(0, { message: 'El peso no puede ser negativo.' })
  peso: number;

  @IsInt({ message: 'Las repeticiones deben ser un entero.' })
  @Min(1, { message: 'Las repeticiones tienen que ser mayores a 0.' })
  repeticiones: number;

  @IsInt({ message: 'El RIR debe ser un entero.' })
  @Min(0, { message: 'El RIR no puede ser negativo.' })
  rir: number;
}
