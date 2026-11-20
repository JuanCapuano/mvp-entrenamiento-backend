// Lo prescripto para un ejercicio de la rutina: cuántas series pide la dosificación
export interface ObjetivoEjercicio {
  readonly ejercicioId: number;
  readonly seriesObjetivo: number;
}

// Service de dominio: cuánto de lo prescripto se hizo (series registradas frente a series objetivo).
// Clase pura: recibe los datos ya cargados y no consulta la base.
// Las series de más no suman: el tope es 100 % por ejercicio y, por lo tanto, también por sesión.
export class CalculadoraCumplimiento {
  // Porcentaje entero de un ejercicio
  calcularEjercicio(seriesRegistradas: number, seriesObjetivo: number): number {
    if (seriesObjetivo <= 0) return 0;
    return Math.round(
      (this.seriesQueCuentan(seriesRegistradas, seriesObjetivo) /
        seriesObjetivo) *
        100,
    );
  }

  // Porcentaje entero de la sesión: series que cuentan sobre el total de series objetivo de la rutina.
  // Las series de ejercicios que no están en la rutina no cuentan.
  calcularSesion(
    objetivos: readonly ObjetivoEjercicio[],
    series: readonly { readonly ejercicioId: number }[],
  ): number {
    let hechas = 0;
    let objetivo = 0;
    for (const { ejercicioId, seriesObjetivo } of objetivos) {
      const registradas = series.filter(
        (serie) => serie.ejercicioId === ejercicioId,
      ).length;
      hechas += this.seriesQueCuentan(registradas, seriesObjetivo);
      objetivo += Math.max(seriesObjetivo, 0);
    }
    return objetivo === 0 ? 0 : Math.round((hechas / objetivo) * 100);
  }

  private seriesQueCuentan(registradas: number, objetivo: number): number {
    return Math.max(Math.min(registradas, objetivo), 0);
  }
}
