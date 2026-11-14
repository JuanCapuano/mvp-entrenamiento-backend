import { Asignacion } from '../../src/modules/planificacion/domain/entities/asignacion.entity';
import { PlanEntrenamiento } from '../../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';
import { IPlanRepository } from '../../src/modules/planificacion/domain/interfaces/plan.repository-interface';

// Misma interfaz que el repositorio real, para probar los use cases sin base
export class PlanRepositoryEnMemoria implements IPlanRepository {
  readonly planes: PlanEntrenamiento[] = [];

  async guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento> {
    if (!plan.id) {
      plan.id = this.planes.length + 1;
      this.planes.push(plan);
    }
    return plan;
  }

  async buscarPorId(id: number): Promise<PlanEntrenamiento | null> {
    return this.planes.find((plan) => plan.id === id) ?? null;
  }

  async buscarAsignacionesDelDeportista(
    deportistaId: number,
  ): Promise<Asignacion[]> {
    return this.planes
      .flatMap((plan) => plan.asignaciones ?? [])
      .filter((asignacion) => asignacion.deportistaId === deportistaId);
  }
}
