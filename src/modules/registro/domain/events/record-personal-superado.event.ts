export class RecordPersonalSuperado {
  constructor(
    public readonly deportistaId: number,
    public readonly ejercicioId: number,
    public readonly serieId: number,
    public readonly peso: number,
    public readonly repeticiones: number,
    public readonly fecha: string,
  ) {}
}
