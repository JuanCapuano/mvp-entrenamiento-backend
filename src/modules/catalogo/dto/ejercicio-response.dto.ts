import { GrupoMuscular } from '../domain/entities/ejercicio.entity';

// snake_case según la convención del contrato (paso 11)
export class EjercicioResponseDto {
  id: number;
  nombre: string;
  grupo_muscular: GrupoMuscular;
}
