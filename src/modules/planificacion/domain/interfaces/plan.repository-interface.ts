import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';

export const IPlanRepositoryToken = 'IPlanRepository';

// Solo lo que usan los use cases. Lo que se necesita para mostrar va en PlanesQueryService.
export interface IPlanRepository {
  buscarPorId(id: number): Promise<PlanEntrenamiento | null>;
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;
}
