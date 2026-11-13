import { Ejercicio } from '../../src/modules/catalogo/domain/entities/ejercicio.entity';
import { IEjercicioRepository } from '../../src/modules/catalogo/domain/interfaces/ejercicio.repository-interface';

// Misma interfaz que el repositorio real, para probar los use cases sin base
export class EjercicioRepositoryEnMemoria implements IEjercicioRepository {
  constructor(private readonly ejercicios: Ejercicio[] = []) {}

  async buscarPorId(id: number): Promise<Ejercicio | null> {
    return this.ejercicios.find((e) => e.id === id) ?? null;
  }

  async existe(id: number): Promise<boolean> {
    return this.ejercicios.some((e) => e.id === id);
  }
}
