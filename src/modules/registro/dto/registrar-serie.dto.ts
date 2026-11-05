import { IsInt, IsNumber, Min } from 'class-validator';

export class RegistrarSerieDto {
  @IsInt({ message: 'La rutina debe ser un identificador entero.' })
  @Min(1, { message: 'La rutina debe ser un identificador positivo.' })
  rutina_id: number;

  @IsInt({ message: 'El ejercicio debe ser un identificador entero.' })
  @Min(1, { message: 'El ejercicio debe ser un identificador positivo.' })
  ejercicio_id: number;

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
