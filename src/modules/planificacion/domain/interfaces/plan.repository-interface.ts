// Contrato mínimo requerido por US-15. El dueño de planificación lo implementa
// con su agregado PlanEntrenamiento; no se implementa planificación desde registro.
export const IPlanRepositoryToken = 'IPlanRepository';

export interface PlanVigenteParaRegistro {
  readonly id: number;
  contieneEjercicio(rutinaId: number, ejercicioId: number): boolean;
}

export interface IPlanRepository {
  buscarPlanVigenteDelDeportista(
    deportistaId: number,
    fecha: string,
  ): Promise<PlanVigenteParaRegistro | null>;
}
