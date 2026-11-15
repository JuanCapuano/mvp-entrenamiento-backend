import type {
  DosificacionParaRegistro,
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
    // US-16: dosificaciones de cada rutina del plan, por id de rutina
    rutinas?: Record<number, DosificacionParaRegistro[]>;
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

  async buscarDosificacionesDeRutinaVigente(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ) {
    const vigente = this.asignaciones.find(
      (asignacion) =>
        asignacion.deportistaId === deportistaId &&
        asignacion.desde <= fecha &&
        fecha <= asignacion.hasta,
    );
    return vigente?.rutinas?.[rutinaId] ?? null;
  }
}
