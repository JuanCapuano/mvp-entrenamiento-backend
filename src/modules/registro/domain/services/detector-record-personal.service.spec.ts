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

  it('prioriza más peso aunque la nueva serie tenga menos repeticiones', () => {
    expect(detector.superaRecord(serie(62.5, 1), [serie(60, 20)])).toBe(true);
  });

  it('a igual peso compara contra la mayor cantidad de repeticiones del historial', () => {
    const anteriores = [serie(60, 8), serie(60, 10), serie(60, 9)];
    expect(detector.superaRecord(serie(60, 10), anteriores)).toBe(false);
    expect(detector.superaRecord(serie(60, 11), anteriores)).toBe(true);
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

  describe('seriesRecord: qué series del historial fueron récord cuando se registraron', () => {
    const SENTADILLA = 1;
    // El id es el orden en que se registró (RN12)
    const registrada = (
      id: number,
      ejercicioId: number,
      peso: number,
      reps: number,
    ) =>
      Object.assign(
        new Serie(
          ejercicioId,
          1,
          Peso.crear(peso),
          Repeticiones.crear(reps),
          RIR.crear(2),
        ),
        { id },
      );

    it('E8: 60 × 8 (14/10) y después 65 × 8 (21/10): solo la segunda es récord', () => {
      expect(
        detector.seriesRecord([
          registrada(1, SENTADILLA, 60, 8),
          registrada(2, SENTADILLA, 65, 8),
        ]),
      ).toEqual(new Set([2]));
    });
  });
});
