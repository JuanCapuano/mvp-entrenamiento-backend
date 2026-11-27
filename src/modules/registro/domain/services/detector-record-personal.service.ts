import type { Serie } from '../entities/serie.entity';
import { Marca } from '../value-objects/marca.vo';

export class DetectorRecordPersonal {
  // RN9: la serie supera el récord si su marca supera a todas las anteriores.
  // La primera vez que se hace el ejercicio no cuenta como récord.
  superaRecord(serie: Serie, anteriores: readonly Serie[]): boolean {
    if (anteriores.length === 0) return false;
    const nueva = Marca.desdeSerie(serie.peso, serie.repeticiones);
    return anteriores.every((anterior) =>
      nueva.superaA(Marca.desdeSerie(anterior.peso, anterior.repeticiones)),
    );
  }

  // Ids de las series del historial que, cuando se registraron, superaron a todas las anteriores de
  // su ejercicio. Las series se registran siempre el día de hoy (RN12), así que el orden de id es
  // el orden en que se hicieron. Lo usan el historial de sesiones (US-20) y el resumen de la semana.
  seriesRecord(historial: readonly Serie[]): Set<number> {
    const porEjercicio = new Map<number, Serie[]>();
    for (const serie of [...historial].sort((a, b) => a.id - b.id)) {
      const anteriores = porEjercicio.get(serie.ejercicioId) ?? [];
      porEjercicio.set(serie.ejercicioId, [...anteriores, serie]);
    }

    const records = new Set<number>();
    for (const enOrden of porEjercicio.values()) {
      enOrden.forEach((serie, i) => {
        if (this.superaRecord(serie, enOrden.slice(0, i)))
          records.add(serie.id);
      });
    }
    return records;
  }
}
