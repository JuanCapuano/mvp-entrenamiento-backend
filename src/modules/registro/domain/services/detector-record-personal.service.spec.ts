import { DetectorRecordPersonal } from './detector-record-personal.service';
import { Serie } from '../entities/serie.entity';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';

describe('DetectorRecordPersonal (RN9)', () => {
  const detector = new DetectorRecordPersonal();
  const serie = (peso: number, reps: number) =>
    new Serie(1, 1, Peso.crear(peso), Repeticiones.crear(reps), RIR.crear(2));
  it('la primera marca no supera un récord', () => {
    expect(detector.superaRecord(serie(62.5, 8), [])).toBe(false);
  });
  it.each([
    [62.5, 8, true],
    [60, 9, true],
    [60, 8, false],
    [60, 7, false],
    [59, 20, false],
  ])('evalúa %s kg × %s frente a 60 × 8: %s', (peso, reps, esperado) => {
    expect(
      detector.superaRecord(serie(peso as number, reps as number), [
        serie(60, 8),
      ]),
    ).toBe(esperado);
  });
  it('compara contra la mejor marca, sin depender del orden ni del RIR', () => {
    expect(
      detector.superaRecord(serie(62.5, 8), [
        serie(60, 8),
        serie(65, 7),
        serie(50, 10),
      ]),
    ).toBe(false);
  });
});
