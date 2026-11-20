import { Asignacion } from '../entities/asignacion.entity';
import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';

export const IPlanRepositoryToken = 'IPlanRepository';

// Contrato mínimo requerido por US-15 (registro). El agregado PlanEntrenamiento lo va a cumplir
// cuando tenga asignaciones: debe exponer su id y comprobar la combinación de rutina y ejercicio.
export interface PlanVigenteParaRegistro {
  readonly id: number;
  contieneEjercicio(rutinaId: number, ejercicioId: number): boolean;
}

// Contrato mínimo requerido por US-16: lo que la dosificación de un ejercicio le pide al deportista.
export interface DosificacionParaRegistro {
  readonly ejercicioId: number;
  readonly orden: number;
  readonly seriesObjetivo: number;
}

// Solo lo que usan los use cases. Lo que se necesita para mostrar va en PlanesQueryService.
export interface IPlanRepository {
  // Devuelve el plan con sus asignaciones cargadas
  buscarPorId(id: number): Promise<PlanEntrenamiento | null>;

  // Las asignaciones del deportista en todos los planes (RN11)
  buscarAsignacionesDelDeportista(deportistaId: number): Promise<Asignacion[]>;

  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;

  // --- Lo que usa el módulo registro (ver la tabla "Comunicación entre módulos" del CLAUDE.md) ---

  // US-15 (RN3): plan vigente del deportista en esa fecha; null si no tiene.
  buscarPlanVigenteDelDeportista(
    deportistaId: number,
    fecha: string,
  ): Promise<PlanVigenteParaRegistro | null>;

  // US-16: dosificaciones de una rutina del plan vigente del deportista en esa fecha.
  // null si no tiene plan vigente o la rutina no es de ese plan.
  buscarDosificacionesDeRutinaVigente(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ): Promise<DosificacionParaRegistro[] | null>;
}
