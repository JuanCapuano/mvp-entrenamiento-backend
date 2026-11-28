import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Vigencia } from './vigencia.vo';

describe('Vigencia', () => {
  it('rechaza una fecha de inicio posterior a la de fin (RN10)', () => {
    expect(() => Vigencia.crear('2026-12-01', '2026-11-30')).toThrow(
      new DomainException(
        'La fecha de inicio no puede ser posterior a la de fin.',
      ),
    );
  });

  it.each([['2026-02-30', '2026-03-10']])(
    'rechaza fechas inválidas %p → %p',
    (desde, hasta) => {
      expect(() => Vigencia.crear(desde, hasta)).toThrow(
        new DomainException(
          'Las fechas de la vigencia tienen que tener el formato AAAA-MM-DD.',
        ),
      );
    },
  );
});
