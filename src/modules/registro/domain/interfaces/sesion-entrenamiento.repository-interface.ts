import type { SesionEntrenamiento } from '../entities/sesion-entrenamiento.entity';
import type { Serie } from '../entities/serie.entity';
import type { BuscarSesionesQuery } from '../../application/queries/buscar-sesiones.query';

export const ISesionEntrenamientoRepositoryToken =
  'ISesionEntrenamientoRepository';

export interface ISesionEntrenamientoRepository {
  buscarDelDia(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ): Promise<SesionEntrenamiento | null>;
  // US-17: la sesión (con todas sus series) que contiene esa serie
  buscarPorSerie(serieId: number): Promise<SesionEntrenamiento | null>;
  buscarSeriesDelEjercicio(
    deportistaId: number,
    ejercicioId: number,
  ): Promise<Serie[]>;
  guardar(sesion: SesionEntrenamiento): Promise<SesionEntrenamiento>;
  // US-20 (lo usa SesionesQueryService): sesiones del deportista con sus series, filtradas por
  // query.desde / query.hasta, de la más reciente a la más antigua
  buscarSesiones(query: BuscarSesionesQuery): Promise<SesionEntrenamiento[]>;
}
