import { Altura } from './altura.vo';
import { DomainException } from '../../../common/exceptions/domain-exceptions';

describe('Altura Value Object (RN19)', () => {
  it('debe crearse correctamente con un valor mayor a 0', () => {
    const altura = new Altura(1.78);
    expect(altura.getValor()).toBe(1.78);
  });

  it('debe redondear hasta 2 decimales', () => {
    const altura = new Altura(1.784);
    expect(altura.getValor()).toBe(1.78);
  });

  it('debe lanzar DomainException si la altura es igual a 0', () => {
    expect(() => new Altura(0)).toThrow(DomainException);
    expect(() => new Altura(0)).toThrow('La altura tiene que ser mayor a 0.');
  });

  it('debe lanzar DomainException si la altura es negativa', () => {
    expect(() => new Altura(-1.75)).toThrow(DomainException);
  });

  it('debe lanzar DomainException si el valor no es un número', () => {
    expect(() => new Altura(NaN)).toThrow(DomainException);
  });
});
