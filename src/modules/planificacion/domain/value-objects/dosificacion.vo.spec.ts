import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from './dosificacion.vo';
import { RangoRepeticiones } from './rango-repeticiones.vo';

const rango = RangoRepeticiones.crear(8, 10);

describe('Dosificacion', () => {
  it.each([0])('rechaza %i series objetivo', (series) => {
    expect(() => Dosificacion.crear(1, 1, series, rango, 2)).toThrow(
      new DomainException('Las series objetivo tienen que ser 1 o más.'),
    );
  });

  it('rechaza RIR objetivo negativo', () => {
    expect(() => Dosificacion.crear(1, 1, 3, rango, -1)).toThrow(
      new DomainException('El RIR objetivo no puede ser negativo.'),
    );
  });
});
