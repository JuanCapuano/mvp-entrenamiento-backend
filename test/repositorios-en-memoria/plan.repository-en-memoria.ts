import type {
  IPlanRepository,
  PlanVigenteParaRegistro,
} from '../../src/modules/planificacion/domain/interfaces/plan.repository-interface';

// Doble de prueba: no se importa desde src ni sustituye planificación en la app.
export class PlanRepositoryEnMemoria implements IPlanRepository {
  readonly asignaciones: {
    deportistaId: number;
    desde: string;
    hasta: string;
    plan: PlanVigenteParaRegistro;
  }[] = [];

  async buscarPlanVigenteDelDeportista(deportistaId: number, fecha: string) {
    return (
      this.asignaciones.find(
        (asignacion) =>
          asignacion.deportistaId === deportistaId &&
          asignacion.desde <= fecha &&
          fecha <= asignacion.hasta,
      )?.plan ?? null
    );
  }
}
