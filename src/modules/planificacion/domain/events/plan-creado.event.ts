// Hecho: el entrenador armó un plan. Sin lógica; el use case lo publica después de guardar.
export class PlanCreado {
  constructor(
    public readonly planId: number,
    public readonly entrenadorId: number,
    public readonly fecha: string, // YYYY-MM-DD
  ) {}
}
