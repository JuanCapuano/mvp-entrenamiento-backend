import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { PesoCorporal } from './peso-corporal.vo';

describe('PesoCorporal (RN19)', () => {
  it('se crea con un valor mayor a 0', () => {
    expect(PesoCorporal.crear(78.4).valor).toBe(78.4);
  });

  it.each([0, -1, -78.4])('rechaza %p kg', (valor) => {
    expect(() => PesoCorporal.crear(valor)).toThrow(
      new DomainException('El peso corporal tiene que ser mayor a 0.'),
    );
  });

  it.each([NaN, Infinity, '78' as unknown as number, null as never])(
    'rechaza %p porque no es un número',
    (valor) => {
      expect(() => PesoCorporal.crear(valor)).toThrow(DomainException);
    },
  );

  it('es inmutable', () => {
    const peso = PesoCorporal.crear(78.4);
    expect(() => {
      (peso as { valor: number }).valor = 80;
    }).toThrow(TypeError);
    expect(peso.valor).toBe(78.4);
  });

  it('se reconstruye desde el texto que devuelve la base', () => {
    expect(PesoCorporal.desdeBase('78.40').valor).toBe(78.4);
  });
});
