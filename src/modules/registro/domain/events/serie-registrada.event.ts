export class SerieRegistrada {
  constructor(
    public readonly deportistaId: number,
    public readonly sesionId: number,
    public readonly serieId: number,
    public readonly ejercicioId: number,
    public readonly fecha: string,
  ) {}
}
