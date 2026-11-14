import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Vigencia } from './vigencia.vo';

describe('Vigencia', () => {
  it('se crea con desde anterior a hasta', () => {
    const vigencia = Vigencia.crear('2026-10-01', '2026-11-30');
    expect(vigencia.desde).toBe('2026-10-01');
    expect(vigencia.hasta).toBe('2026-11-30');
  });

  it('acepta un solo día (desde igual a hasta)', () => {
    expect(() => Vigencia.crear('2026-10-01', '2026-10-01')).not.toThrow();
  });

  it('rechaza una fecha de inicio posterior a la de fin (RN10)', () => {
    expect(() => Vigencia.crear('2026-12-01', '2026-11-30')).toThrow(
      new DomainException(
        'La fecha de inicio no puede ser posterior a la de fin.',
      ),
    );
  });

  it.each([
    ['01/10/2026', '2026-11-30'],
    ['2026-10-01', ''],
    ['2026-02-30', '2026-03-10'],
    ['2026-13-01', '2026-13-02'],
  ])('rechaza fechas inválidas %p → %p', (desde, hasta) => {
    expect(() => Vigencia.crear(desde, hasta)).toThrow(DomainException);
  });

  describe('seSuperponeCon (RN11)', () => {
    const base = Vigencia.crear('2026-10-01', '2026-11-30');

    it.each([
      ['empieza dentro', '2026-11-15', '2026-12-15'],
      ['termina dentro', '2026-09-01', '2026-10-15'],
      ['está contenida', '2026-10-10', '2026-10-20'],
      ['la contiene', '2026-09-01', '2026-12-31'],
      ['empieza el último día', '2026-11-30', '2026-12-31'],
      ['termina el primer día', '2026-09-01', '2026-10-01'],
    ])('se superpone si %s', (_caso, desde, hasta) => {
      expect(base.seSuperponeCon(Vigencia.crear(desde, hasta))).toBe(true);
    });

    it.each([
      ['termina antes', '2026-08-01', '2026-09-30'],
      ['empieza después', '2026-12-01', '2026-12-31'],
    ])('no se superpone si %s', (_caso, desde, hasta) => {
      expect(base.seSuperponeCon(Vigencia.crear(desde, hasta))).toBe(false);
    });
  });

  it('contiene una fecha dentro del período, extremos incluidos', () => {
    const vigencia = Vigencia.crear('2026-10-01', '2026-11-30');
    expect(vigencia.contiene('2026-10-01')).toBe(true);
    expect(vigencia.contiene('2026-11-30')).toBe(true);
    expect(vigencia.contiene('2026-12-01')).toBe(false);
  });
});
