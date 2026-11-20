// Hecho: el entrenador asignó un plan a un deportista. Sin lógica; el use case lo publica después de guardar.
export class PlanAsignado {
  constructor(
    public readonly planId: number,
    public readonly deportistaId: number,
    public readonly entrenadorId: number,
    public readonly vigenciaDesde: string, // YYYY-MM-DD
    public readonly vigenciaHasta: string, // YYYY-MM-DD
    public readonly fecha: string, // YYYY-MM-DD
  ) {}
}
