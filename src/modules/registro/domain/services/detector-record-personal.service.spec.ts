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

  it('prioriza más peso aunque la nueva serie tenga menos repeticiones', () => {
    expect(detector.superaRecord(serie(62.5, 1), [serie(60, 20)])).toBe(true);
  });

  it('a igual peso compara contra la mayor cantidad de repeticiones del historial', () => {
    const anteriores = [serie(60, 8), serie(60, 10), serie(60, 9)];
    expect(detector.superaRecord(serie(60, 10), anteriores)).toBe(false);
    expect(detector.superaRecord(serie(60, 11), anteriores)).toBe(true);
  });

  it('peso corporal: la primera serie no cuenta y una marca previa se supera con más repeticiones', () => {
    expect(detector.superaRecord(serie(0, 8), [])).toBe(false);
    expect(detector.superaRecord(serie(0, 9), [serie(0, 8)])).toBe(true);
  });

  it('cambiar solamente el RIR no supera una marca', () => {
    const nueva = new Serie(
      1,
      2,
      Peso.crear(60),
      Repeticiones.crear(8),
      RIR.crear(0),
    );
    expect(detector.superaRecord(nueva, [serie(60, 8)])).toBe(false);
  });
});
