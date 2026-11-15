// Hecho: el deportista corrigió los valores de una serie que había registrado hoy.
// Sin lógica; el use case lo publica después de guardar.
export class SerieCorregida {
  constructor(
    public readonly deportistaId: number,
    public readonly sesionId: number,
    public readonly serieId: number,
    public readonly ejercicioId: number,
    public readonly fecha: string, // YYYY-MM-DD
  ) {}
}
