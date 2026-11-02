import { Ejercicio } from '../entities/ejercicio.entity';

export const IEjercicioRepositoryToken = 'IEjercicioRepository';

// Lo usan Planificación y Registro; las consultas del catálogo van por EjerciciosQueryService
export interface IEjercicioRepository {
  buscarPorId(id: number): Promise<Ejercicio | null>;

  existe(id: number): Promise<boolean>;
}
