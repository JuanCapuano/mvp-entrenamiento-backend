import { Marca } from '../value-objects/marca.vo';

// Lo mínimo de una serie registrada para calcular el progreso: la fecha es la de su sesión
export interface MarcaDeSerie {
  readonly fecha: string; // YYYY-MM-DD
  readonly peso: number; // kg; 0 = peso corporal
  readonly repeticiones: number;
}

export interface RecordPersonal {
  readonly peso: number;
  readonly repeticiones: number;
  readonly fecha: string; // primera vez que se logró la marca
}

// Lo que se hizo en un ejercicio en una fecha (puede venir de más de una sesión, si fueron rutinas distintas)
export interface ProgresoDeLaFecha {
  readonly fecha: string;
  readonly pesoMaximo: number;
  readonly rmEstimado: number; // 1RM de Epley, el mayor del día, con 1 decimal (RN16)
  readonly mejorSerie: { readonly peso: number; readonly repeticiones: number }; // RN9 (Marca.superaA)
  readonly volumen: number; // Σ peso × repeticiones, en kg
}

export interface ProgresoDelEjercicio {
  readonly record: RecordPersonal | null;
  readonly porFecha: readonly ProgresoDeLaFecha[];
}

// Service de dominio (US-19, CU11): cómo cambian las marcas de un ejercicio a lo largo de las sesiones.
// Clase pura: recibe las series ya cargadas y no consulta la base. El progreso se calcula, no se guarda.
export class CalculadoraProgreso {
  calcular(series: readonly MarcaDeSerie[]): ProgresoDelEjercicio {
    return {
      record: this.record(series),
      porFecha: this.porFecha(series),
    };
  }

  // RN16: 1RM = peso × (1 + repeticiones / 30), redondeado a 1 decimal (E8: 65 × 8 → 82,3)
  rmEstimado(peso: number, repeticiones: number): number {
    return this.redondear(peso * (1 + repeticiones / 30), 1);
  }

  // RN9 la decide el value object Marca: acá solo se elige cuál de las dos series es mejor
  private esMejor(serie: MarcaDeSerie, otra: MarcaDeSerie): boolean {
    return Marca.crear(serie.peso, serie.repeticiones).superaA(
      Marca.crear(otra.peso, otra.repeticiones),
    );
  }

  // RN9: la mejor marca de todas las sesiones. Ante la misma marca se queda con la primera fecha.
  private record(series: readonly MarcaDeSerie[]): RecordPersonal | null {
    let record: MarcaDeSerie | null = null;
    for (const serie of this.ordenadasPorFecha(series)) {
      if (!record || this.esMejor(serie, record)) record = serie;
    }
    return record
      ? {
          peso: record.peso,
          repeticiones: record.repeticiones,
          fecha: record.fecha,
        }
      : null;
  }

  // Una entrada por fecha, de la más antigua a la más reciente (así se grafica la evolución)
  private porFecha(series: readonly MarcaDeSerie[]): ProgresoDeLaFecha[] {
    const delDia = new Map<string, MarcaDeSerie[]>();
    for (const serie of this.ordenadasPorFecha(series)) {
      delDia.set(serie.fecha, [...(delDia.get(serie.fecha) ?? []), serie]);
    }
    return [...delDia].map(([fecha, seriesDelDia]) =>
      this.resumirFecha(fecha, seriesDelDia),
    );
  }

  private resumirFecha(
    fecha: string,
    series: readonly MarcaDeSerie[],
  ): ProgresoDeLaFecha {
    const mejor = series.reduce((mejorHastaAhora, serie) =>
      this.esMejor(serie, mejorHastaAhora) ? serie : mejorHastaAhora,
    );
    return {
      fecha,
      // La mejor serie es la de más peso, así que su peso es el máximo del día
      pesoMaximo: mejor.peso,
      rmEstimado: Math.max(
        ...series.map((serie) =>
          this.rmEstimado(serie.peso, serie.repeticiones),
        ),
      ),
      mejorSerie: { peso: mejor.peso, repeticiones: mejor.repeticiones },
      // Los pesos tienen hasta 2 decimales: se redondea para no arrastrar errores de punto flotante
      volumen: this.redondear(
        series.reduce(
          (total, serie) => total + serie.peso * serie.repeticiones,
          0,
        ),
        2,
      ),
    };
  }

  // Orden estable: si dos series tienen la misma fecha, se respeta el orden en que llegaron
  private ordenadasPorFecha(series: readonly MarcaDeSerie[]): MarcaDeSerie[] {
    return [...series].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  private redondear(valor: number, decimales: number): number {
    const factor = 10 ** decimales;
    return Math.round(valor * factor) / factor;
  }
}
