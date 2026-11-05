import type { SesionEntrenamiento } from '../entities/sesion-entrenamiento.entity';
import type { Serie } from '../entities/serie.entity';

export const ISesionEntrenamientoRepositoryToken =
  'ISesionEntrenamientoRepository';

export interface ISesionEntrenamientoRepository {
  buscarDelDia(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ): Promise<SesionEntrenamiento | null>;
  buscarSeriesDelEjercicio(
    deportistaId: number,
    ejercicioId: number,
  ): Promise<Serie[]>;
  guardar(sesion: SesionEntrenamiento): Promise<SesionEntrenamiento>;
}
