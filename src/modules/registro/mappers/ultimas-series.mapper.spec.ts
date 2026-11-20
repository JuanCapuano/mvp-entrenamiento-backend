import { Serie } from '../domain/entities/serie.entity';
import { Peso } from '../domain/value-objects/peso.vo';
import { Repeticiones } from '../domain/value-objects/repeticiones.vo';
import { RIR } from '../domain/value-objects/rir.vo';
import { UltimasSeriesMapper } from './ultimas-series.mapper';

const SENTADILLA = 1;

const serie = (numero: number, peso: number, repeticiones: number, rir = 2) =>
  new Serie(
    SENTADILLA,
    numero,
    Peso.crear(peso),
    Repeticiones.crear(repeticiones),
    RIR.crear(rir),
  );

describe('UltimasSeriesMapper (US-14)', () => {
  it('E1: devuelve la fecha y las series con número, peso, repeticiones y RIR', () => {
    const dto = UltimasSeriesMapper.aDto('2026-10-14', [
      serie(1, 60, 8),
      serie(2, 60, 8),
      serie(3, 60, 8, 1),
    ]);

    expect(dto).toEqual({
      fecha: '2026-10-14',
      series: [
        { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 2, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 3, peso: 60, repeticiones: 8, rir: 1 },
      ],
    });
  });

  it('ordena las series por su número aunque lleguen desordenadas', () => {
    const dto = UltimasSeriesMapper.aDto('2026-10-14', [
      serie(2, 62.5, 7),
      serie(1, 62.5, 8),
    ]);

    expect(dto.series.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('no expone el id de la serie: las de otro día no se pueden corregir (RN8)', () => {
    const conId = Object.assign(serie(1, 60, 8), { id: 99, sesionId: 5 });

    const dto = UltimasSeriesMapper.aDto('2026-10-14', [conId]);

    expect(Object.keys(dto.series[0])).toEqual([
      'numero',
      'peso',
      'repeticiones',
      'rir',
    ]);
  });

  it('si nunca hizo el ejercicio: fecha null y series vacías', () => {
    expect(UltimasSeriesMapper.sinHistorial()).toEqual({
      fecha: null,
      series: [],
    });
  });
});
