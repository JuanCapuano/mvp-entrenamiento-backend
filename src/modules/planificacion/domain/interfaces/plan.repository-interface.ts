import { Asignacion } from '../entities/asignacion.entity';
import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';

export const IPlanRepositoryToken = 'IPlanRepository';

// Solo lo que usan los use cases. Lo que se necesita para mostrar va en PlanesQueryService.
export interface IPlanRepository {
  // Devuelve el plan con sus asignaciones cargadas
  buscarPorId(id: number): Promise<PlanEntrenamiento | null>;

  // Las asignaciones del deportista en todos los planes (RN11)
  buscarAsignacionesDelDeportista(deportistaId: number): Promise<Asignacion[]>;

  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;
}
