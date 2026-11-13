import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';

export const IPlanRepositoryToken = 'IPlanRepository';

// Solo lo que usan los use cases. Lo que se necesita para mostrar va en PlanesQueryService.
export interface IPlanRepository {
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;
}
