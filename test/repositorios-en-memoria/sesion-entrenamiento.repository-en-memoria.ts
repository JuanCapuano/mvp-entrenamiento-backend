import { SesionEntrenamiento } from '../../src/modules/registro/domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../../src/modules/registro/domain/entities/serie.entity';
import type { ISesionEntrenamientoRepository } from '../../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import { RegistroConcurrenteException } from '../../src/modules/registro/domain/exceptions/registro-concurrente.exception';

function copiar(sesion: SesionEntrenamiento): SesionEntrenamiento {
  return Object.assign(new SesionEntrenamiento(), sesion, {
    seriesRegistradas: sesion.series.map((serie) =>
      Object.assign(new Serie(), serie),
    ),
  });
}

export class SesionEntrenamientoRepositoryEnMemoria implements ISesionEntrenamientoRepository {
  private readonly sesiones = new Map<number, SesionEntrenamiento>();
  private siguienteSesion = 1;
  private siguienteSerie = 1;

  async buscarDelDia(deportistaId: number, rutinaId: number, fecha: string) {
    const sesion = [...this.sesiones.values()].find(
      (sesion) =>
        sesion.deportistaId === deportistaId &&
        sesion.rutinaId === rutinaId &&
        sesion.fecha === fecha,
    );
    return sesion ? copiar(sesion) : null;
  }

  async buscarSeriesDelEjercicio(deportistaId: number, ejercicioId: number) {
    return [...this.sesiones.values()]
      .filter((sesion) => sesion.deportistaId === deportistaId)
      .flatMap((sesion) =>
        copiar(sesion).series.filter(
          (serie) => serie.ejercicioId === ejercicioId,
        ),
      );
  }

  async guardar(sesion: SesionEntrenamiento) {
    const existente = [...this.sesiones.values()].find(
      (otra) =>
        otra.deportistaId === sesion.deportistaId &&
        otra.rutinaId === sesion.rutinaId &&
        otra.fecha === sesion.fecha,
    );
    if (existente && existente.id !== sesion.id)
      throw new RegistroConcurrenteException();
    for (const nueva of sesion.series.filter((serie) => !serie.id)) {
      if (
        existente?.series.some(
          (serie) =>
            serie.ejercicioId === nueva.ejercicioId &&
            serie.numeroSerie === nueva.numeroSerie,
        )
      ) {
        throw new RegistroConcurrenteException();
      }
    }
    const guardada = copiar(sesion);
    Object.assign(guardada, { id: sesion.id || this.siguienteSesion++ });
    for (const serie of guardada.series) {
      Object.assign(serie, {
        id: serie.id || this.siguienteSerie++,
        sesionId: guardada.id,
      });
    }
    const ids = new Set(guardada.series.map((serie) => serie.id));
    Object.assign(guardada, {
      seriesRegistradas: [
        ...(existente?.series.filter((serie) => !ids.has(serie.id)) ?? []),
        ...guardada.series,
      ],
    });
    this.sesiones.set(guardada.id, guardada);
    return copiar(guardada);
  }
}
