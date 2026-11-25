import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// QueryObject de GET /api/progreso?ejercicio_id=1
export class ProgresoQuery {
  @Type(() => Number)
  @IsInt({ message: 'El ejercicio debe ser un identificador entero.' })
  @Min(1, { message: 'El ejercicio debe ser un identificador positivo.' })
  ejercicio_id: number;
}
