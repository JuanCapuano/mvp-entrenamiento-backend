import { Ejercicio } from '../domain/entities/ejercicio.entity';
import { EjercicioResponseDto } from '../dto/ejercicio-response.dto';

export class EjercicioMapper {
  static aDto(ejercicio: Ejercicio): EjercicioResponseDto {
    return {
      id: ejercicio.id,
      nombre: ejercicio.nombre,
      grupo_muscular: ejercicio.grupoMuscular,
      subgrupo: ejercicio.subgrupo,
    };
  }
}
