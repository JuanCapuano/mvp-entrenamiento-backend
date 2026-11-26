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
}
