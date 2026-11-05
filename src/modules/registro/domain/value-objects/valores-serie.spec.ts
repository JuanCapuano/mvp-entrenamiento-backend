import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Peso } from './peso.vo';
import { Repeticiones } from './repeticiones.vo';
import { RIR } from './rir.vo';

describe('Value objects de una serie (RN4–RN6)', () => {
  it.each([0, 0.01, 0.29, 62.5, 62.55])(
    'acepta peso %s, incluido peso corporal',
    (valor) => {
      expect(Peso.crear(valor).valor).toBe(valor);
      expect(Peso.desdeBase(String(valor)).valor).toBe(valor);
      expect(Object.isFrozen(Peso.crear(valor))).toBe(true);
    },
  );
  it('rechaza peso negativo con el mensaje de E5', () => {
    expect(() => Peso.crear(-5)).toThrow('El peso no puede ser negativo.');
  });
  it.each([NaN, Infinity, -Infinity, '60', null, undefined])(
    'rechaza peso no numérico o no finito: %s',
    (valor) => {
      expect(() => Peso.crear(valor as number)).toThrow(DomainException);
    },
  );
  it('rechaza más de dos decimales sin redondear', () => {
    expect(() => Peso.crear(0.001)).toThrow(
      'El peso admite hasta 2 decimales.',
    );
  });
  it.each([0, -1, 1.5, NaN, Infinity, '8', null, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza repeticiones %s',
    (valor) => {
      expect(() => Repeticiones.crear(valor as number)).toThrow(
        'Las repeticiones tienen que ser mayores a 0.',
      );
    },
  );
  it.each([-1, 1.5, NaN, Infinity, '2', null, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza RIR %s',
    (valor) => {
      expect(() => RIR.crear(valor as number)).toThrow(DomainException);
    },
  );
  it('hidrata repeticiones y RIR como objetos inmutables', () => {
    expect(Repeticiones.desdeBase(8).valor).toBe(8);
    expect(RIR.desdeBase(0).valor).toBe(0);
    expect(Object.isFrozen(Repeticiones.crear(8))).toBe(true);
    expect(Object.isFrozen(RIR.crear(2))).toBe(true);
  });
});
