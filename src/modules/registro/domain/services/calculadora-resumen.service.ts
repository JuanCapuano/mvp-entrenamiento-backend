// Lo mínimo de una serie registrada para armar el resumen. La fecha es la de su sesión.
export interface SerieDelResumen {
  readonly sesionId: number;
  readonly fecha: string; // YYYY-MM-DD
  readonly peso: number; // kg; 0 = peso corporal
  readonly repeticiones: number;
  readonly record: boolean; // si fue récord personal cuando se registró (DetectorRecordPersonal, RN9)
}

// Todo es de la semana de hoy (lunes a domingo), menos volumenAnterior
export interface ResumenDeLaSemana {
  readonly desde: string; // lunes, YYYY-MM-DD
  readonly hasta: string; // domingo, YYYY-MM-DD
  readonly records: number;
  readonly volumen: number; // Σ peso × repeticiones, en kg
  readonly volumenAnterior: number; // el mismo cálculo, la semana anterior
  readonly sesiones: number;
  readonly series: number;
}

// Service de dominio: resumen de la semana del deportista, de todos los ejercicios juntos.
// Clase pura: recibe las series ya cargadas y la fecha de hoy, no consulta la base.
// Qué serie fue récord no lo decide acá: llega marcado por DetectorRecordPersonal.
export class CalculadoraResumen {
  resumir(series: readonly SerieDelResumen[], hoy: string): ResumenDeLaSemana {
    const desde = this.lunesDeLaSemana(hoy);
    const hasta = this.sumarDias(desde, 6);
    const desdeAnterior = this.sumarDias(desde, -7);
    const hastaAnterior = this.sumarDias(desde, -1);

    const enLaSemana = (serie: SerieDelResumen) =>
      serie.fecha >= desde && serie.fecha <= hasta;
    const deLaSemana = series.filter(enLaSemana);

    return {
      desde,
      hasta,
      records: deLaSemana.filter((serie) => serie.record).length,
      volumen: this.volumen(deLaSemana),
      volumenAnterior: this.volumen(
        series.filter(
          (serie) =>
            serie.fecha >= desdeAnterior && serie.fecha <= hastaAnterior,
        ),
      ),
      sesiones: new Set(deLaSemana.map((serie) => serie.sesionId)).size,
      series: deLaSemana.length,
    };
  }

  // Los pesos tienen hasta 2 decimales: se redondea para no arrastrar errores de punto flotante
  private volumen(series: readonly SerieDelResumen[]): number {
    const total = series.reduce(
      (suma, serie) => suma + serie.peso * serie.repeticiones,
      0,
    );
    return Math.round(total * 100) / 100;
  }

  // La semana va de lunes a domingo
  private lunesDeLaSemana(fecha: string): string {
    const diaDeLaSemana = this.aFecha(fecha).getUTCDay(); // 0 = domingo
    return this.sumarDias(fecha, diaDeLaSemana === 0 ? -6 : 1 - diaDeLaSemana);
  }

  private sumarDias(fecha: string, dias: number): string {
    const resultado = this.aFecha(fecha);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
  }

  // En UTC, para que la zona horaria del servidor no corra el día
  private aFecha(fecha: string): Date {
    return new Date(`${fecha}T00:00:00Z`);
  }
}
