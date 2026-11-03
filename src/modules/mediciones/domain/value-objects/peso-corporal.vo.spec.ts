import { PesoCorporal } from './peso-corporal.vo';
import { DomainException } from '../../../common/exceptions/domain-exceptions';

describe('PesoCorporal Value Object (RN19)', () => {
  it('debe crearse correctamente con un valor mayor a 0', () => {
    const peso = new PesoCorporal(75.5);
    expect(peso.getValor()).toBe(75.5);
  });

  it('debe redondear hasta 2 decimales', () => {
    const peso = new PesoCorporal(75.556);
    expect(peso.getValor()).toBe(75.56);
  });

  it('debe lanzar DomainException si el peso es igual a 0', () => {
    expect(() => new PesoCorporal(0)).toThrow(DomainException);
    expect(() => new PesoCorporal(0)).toThrow(
      'El peso corporal tiene que ser mayor a 0.',
    );
  });

  it('debe lanzar DomainException si el peso es negativo', () => {
    expect(() => new PesoCorporal(-5)).toThrow(DomainException);
  });

  it('debe lanzar DomainException si el valor es NaN o inválido', () => {
    expect(() => new PesoCorporal(NaN)).toThrow(DomainException);
  });
});
