import type { Serie } from '../entities/serie.entity';

export class DetectorRecordPersonal {
  superaRecord(serie: Serie, anteriores: readonly Serie[]): boolean {
    if (anteriores.length === 0) return false;
    return anteriores.every(
      (anterior) =>
        serie.peso.valor > anterior.peso.valor ||
        (serie.peso.valor === anterior.peso.valor &&
          serie.repeticiones.valor > anterior.repeticiones.valor),
    );
  }
}
