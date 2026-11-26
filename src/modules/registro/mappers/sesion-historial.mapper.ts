import type { DosificacionParaRegistro } from '../../planificacion/domain/interfaces/plan.repository-interface';
import type { SesionEntrenamiento } from '../domain/entities/sesion-entrenamiento.entity';
import type { CalculadoraCumplimiento } from '../domain/services/calculadora-cumplimiento.service';
import type { SesionHistorialResponseDto } from '../dto/sesion-historial-response.dto';

// Lo que hace falta de la rutina de la sesión (viene de planificación)
export interface RutinaDeLaSesion {
  nombre: string;
  dosificaciones: readonly DosificacionParaRegistro[];
}

export class SesionHistorialMapper {
  // Una sesión con un ejercicio por dosificación, en el orden de la rutina, y sus series.
  // El cumplimiento lo calcula CalculadoraCumplimiento, igual que en la sesión de hoy.
  // seriesRecord: ids de las series que fueron récord personal (los decide DetectorRecordPersonal).
  static aDto(
    sesion: SesionEntrenamiento,
    rutina: RutinaDeLaSesion | null,
    nombresEjercicios: ReadonlyMap<number, string>,
    calculadora: CalculadoraCumplimiento,
    seriesRecord: ReadonlySet<number>,
  ): SesionHistorialResponseDto {
    const dosificaciones = [...(rutina?.dosificaciones ?? [])].sort(
      (a, b) => a.orden - b.orden,
    );

    return {
      fecha: sesion.fecha,
      rutina: rutina?.nombre ?? '',
      cumplimiento: calculadora.calcularSesion(dosificaciones, sesion.series),
      ejercicios: dosificaciones.map((dosificacion) => {
        const series = sesion.series
          .filter((serie) => serie.ejercicioId === dosificacion.ejercicioId)
          .sort((a, b) => a.numeroSerie - b.numeroSerie);

        return {
          nombre: nombresEjercicios.get(dosificacion.ejercicioId) ?? '',
          cumplimiento: calculadora.calcularEjercicio(
            series.length,
            dosificacion.seriesObjetivo,
          ),
          series: series.map((serie) => ({
            numero: serie.numeroSerie,
            peso: serie.peso.valor,
            repeticiones: serie.repeticiones.valor,
            rir: serie.rir.valor,
            record_personal: seriesRecord.has(serie.id),
          })),
        };
      }),
    };
  }
}
