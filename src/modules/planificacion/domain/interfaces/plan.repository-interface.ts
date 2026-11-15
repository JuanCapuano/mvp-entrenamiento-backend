// Contrato mínimo requerido por US-15. El dueño de planificación lo implementa
// con su agregado PlanEntrenamiento; no se implementa planificación desde registro.
export const IPlanRepositoryToken = 'IPlanRepository';

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

export interface IPlanRepository {
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
