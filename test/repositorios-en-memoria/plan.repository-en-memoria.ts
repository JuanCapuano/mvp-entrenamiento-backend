import { PlanEntrenamiento } from '../../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';
import type {
  DosificacionParaRegistro,
  IPlanRepository,
  PlanVigenteParaRegistro,
} from '../../src/modules/planificacion/domain/interfaces/plan.repository-interface';

// Misma interfaz que el repositorio real, para probar los use cases sin base.
// Doble de prueba: no se importa desde src ni sustituye planificación en la app.
export class PlanRepositoryEnMemoria implements IPlanRepository {
  // Planificación (US-06): planes guardados
  readonly planes: PlanEntrenamiento[] = [];

  // Registro (US-15, US-16): qué plan tiene vigente cada deportista
  readonly asignaciones: {
    deportistaId: number;
    desde: string;
    hasta: string;
    plan: PlanVigenteParaRegistro;
    // US-16: dosificaciones de cada rutina del plan, por id de rutina
    rutinas?: Record<number, DosificacionParaRegistro[]>;
  }[] = [];

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

  async buscarPlanVigenteDelDeportista(deportistaId: number, fecha: string) {
    return this.asignacionVigente(deportistaId, fecha)?.plan ?? null;
  }

  async buscarDosificacionesDeRutinaVigente(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ) {
    return (
      this.asignacionVigente(deportistaId, fecha)?.rutinas?.[rutinaId] ?? null
    );
  }

  private asignacionVigente(deportistaId: number, fecha: string) {
    return this.asignaciones.find(
      (asignacion) =>
        asignacion.deportistaId === deportistaId &&
        asignacion.desde <= fecha &&
        fecha <= asignacion.hasta,
    );
  }
}
