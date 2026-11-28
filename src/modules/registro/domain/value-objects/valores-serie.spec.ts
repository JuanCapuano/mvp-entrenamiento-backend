import { Peso } from './peso.vo';
import { Repeticiones } from './repeticiones.vo';

describe('Value objects de una serie (RN4–RN6)', () => {
  it.each([0])('acepta peso %s, incluido peso corporal', (valor) => {
    expect(Peso.crear(valor).valor).toBe(valor);
    expect(Peso.desdeBase(String(valor)).valor).toBe(valor);
    expect(Object.isFrozen(Peso.crear(valor))).toBe(true);
  });
  it('rechaza peso negativo con el mensaje de E5', () => {
    expect(() => Peso.crear(-5)).toThrow('El peso no puede ser negativo.');
  });
  it('rechaza más de dos decimales sin redondear', () => {
    expect(() => Peso.crear(0.001)).toThrow(
      'El peso admite hasta 2 decimales.',
    );
  });
  it.each([0])('rechaza repeticiones %s', (valor) => {
    expect(() => Repeticiones.crear(valor as number)).toThrow(
      'Las repeticiones tienen que ser mayores a 0.',
    );
  });
});
