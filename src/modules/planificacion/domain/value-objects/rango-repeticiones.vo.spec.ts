import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { RangoRepeticiones } from './rango-repeticiones.vo';

describe('RangoRepeticiones', () => {
  it('se crea con mínimo menor al máximo', () => {
    const rango = RangoRepeticiones.crear(8, 10);
    expect(rango.minimo).toBe(8);
    expect(rango.maximo).toBe(10);
  });

  it('acepta mínimo igual al máximo (RN15: mínimo ≤ máximo)', () => {
    expect(RangoRepeticiones.crear(5, 5).maximo).toBe(5);
  });

  it('rechaza mínimo mayor al máximo', () => {
    expect(() => RangoRepeticiones.crear(10, 8)).toThrow(
      new DomainException(
        'Las repeticiones mínimas no pueden ser mayores a las máximas.',
      ),
    );
  });

  it.each([0, -1])('rechaza repeticiones mínimas de %i', (minimo) => {
    expect(() => RangoRepeticiones.crear(minimo, 10)).toThrow(
      new DomainException('Las repeticiones tienen que ser mayores a 0.'),
    );
  });

  it('rechaza repeticiones que no son enteras', () => {
    expect(() => RangoRepeticiones.crear(8.5, 10)).toThrow(DomainException);
  });
});
