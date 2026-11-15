import type { DosificacionParaRegistro } from '../../planificacion/domain/interfaces/plan.repository-interface';
import type { Serie } from '../domain/entities/serie.entity';
import type { SesionDeHoyResponseDto } from '../dto/sesion-de-hoy-response.dto';

export class SesionDeHoyMapper {
  // Un ejercicio por dosificación, en el orden de la rutina, con todas sus series de hoy
  // (aunque todavía no tenga ninguna o tenga más que las pedidas).
  static aDto(
    dosificaciones: readonly DosificacionParaRegistro[],
    series: readonly Serie[],
    cumplimiento: number,
  ): SesionDeHoyResponseDto {
    return {
      cumplimiento,
      ejercicios: [...dosificaciones]
        .sort((a, b) => a.orden - b.orden)
        .map((dosificacion) => ({
          ejercicio_id: dosificacion.ejercicioId,
          series_objetivo: dosificacion.seriesObjetivo,
          series: series
            .filter((serie) => serie.ejercicioId === dosificacion.ejercicioId)
            .sort((a, b) => a.numeroSerie - b.numeroSerie)
            .map((serie) => ({
              id: serie.id,
              numero: serie.numeroSerie,
              peso: serie.peso.valor,
              repeticiones: serie.repeticiones.valor,
              rir: serie.rir.valor,
            })),
        })),
    };
  }
}
