import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { RangoRepeticiones } from './rango-repeticiones.vo';

describe('RangoRepeticiones', () => {
  it('rechaza mínimo mayor al máximo', () => {
    expect(() => RangoRepeticiones.crear(10, 8)).toThrow(
      new DomainException(
        'Las repeticiones mínimas no pueden ser mayores a las máximas.',
      ),
    );
  });
});
