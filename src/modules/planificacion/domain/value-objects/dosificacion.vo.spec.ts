import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from './dosificacion.vo';
import { RangoRepeticiones } from './rango-repeticiones.vo';

const rango = RangoRepeticiones.crear(8, 10);

describe('Dosificacion', () => {
  it('se crea con series ≥ 1, rango válido y RIR ≥ 0', () => {
    const d = Dosificacion.crear(1, 1, 3, rango, 2);
    expect(d.ejercicioId).toBe(1);
    expect(d.orden).toBe(1);
    expect(d.seriesObjetivo).toBe(3);
    expect(d.rangoRepeticiones).toBe(rango);
    expect(d.rirObjetivo).toBe(2);
  });

  it('acepta 1 serie y RIR 0 (los límites)', () => {
    expect(() => Dosificacion.crear(1, 1, 1, rango, 0)).not.toThrow();
  });

  it.each([0, -2])('rechaza %i series objetivo', (series) => {
    expect(() => Dosificacion.crear(1, 1, series, rango, 2)).toThrow(
      new DomainException('Las series objetivo tienen que ser 1 o más.'),
    );
  });

  it('rechaza RIR objetivo negativo', () => {
    expect(() => Dosificacion.crear(1, 1, 3, rango, -1)).toThrow(
      new DomainException('El RIR objetivo no puede ser negativo.'),
    );
  });

  it.each([0, -1, 1.5])('rechaza el orden %p', (orden) => {
    expect(() => Dosificacion.crear(1, orden, 3, rango, 2)).toThrow(
      DomainException,
    );
  });
});
