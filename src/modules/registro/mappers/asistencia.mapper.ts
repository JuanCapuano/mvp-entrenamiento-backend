import type { SesionEntrenamiento } from '../domain/entities/sesion-entrenamiento.entity';
import type { AsistenciaResponseDto } from '../dto/asistencia-response.dto';

export class AsistenciaMapper {
  // RN17: de la sesión solo sale la fecha. Las series se usan para calcular el cumplimiento,
  // pero no se exponen: el entrenador no ve pesos, repeticiones ni RIR.
  static aDto(
    sesion: SesionEntrenamiento,
    nombreRutina: string,
    cumplimiento: number,
  ): AsistenciaResponseDto {
    return { fecha: sesion.fecha, rutina: nombreRutina, cumplimiento };
  }
}
