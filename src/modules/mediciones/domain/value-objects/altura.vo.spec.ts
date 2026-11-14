import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Altura } from './altura.vo';

describe('Altura (RN19)', () => {
  it('se crea con un valor mayor a 0', () => {
    expect(Altura.crear(1.76).valor).toBe(1.76);
  });

  it.each([0, -1, -1.76])('rechaza %p m', (valor) => {
    expect(() => Altura.crear(valor)).toThrow(
      new DomainException('La altura tiene que ser mayor a 0.'),
    );
  });

  it.each([NaN, Infinity, '1.76' as unknown as number, null as never])(
    'rechaza %p porque no es un número',
    (valor) => {
      expect(() => Altura.crear(valor)).toThrow(DomainException);
    },
  );

  it('es inmutable', () => {
    const altura = Altura.crear(1.76);
    expect(() => {
      (altura as { valor: number }).valor = 2;
    }).toThrow(TypeError);
    expect(altura.valor).toBe(1.76);
  });

  it('se reconstruye desde el texto que devuelve la base', () => {
    expect(Altura.desdeBase('1.76').valor).toBe(1.76);
  });
});
