import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Marca } from './marca.vo';
import { Peso } from './peso.vo';
import { Repeticiones } from './repeticiones.vo';

describe('Marca (RN9)', () => {
  describe('superaA', () => {
    it.each([
      [62.5, 8, true, 'más peso'],
      [60, 9, true, 'igual peso y más repeticiones'],
      [60, 8, false, 'la misma marca no supera'],
      [60, 7, false, 'igual peso y menos repeticiones'],
      [59, 20, false, 'menos peso aunque tenga más repeticiones'],
      [62.5, 1, true, 'más peso aunque tenga menos repeticiones'],
    ])(
      '%s kg × %s frente a 60 × 8 → %s (%s)',
      (peso, repeticiones, esperado) => {
        expect(
          Marca.crear(peso as number, repeticiones as number).superaA(
            Marca.crear(60, 8),
          ),
        ).toBe(esperado);
      },
    );

    it('con peso corporal (0 kg) se supera con más repeticiones', () => {
      expect(Marca.crear(0, 9).superaA(Marca.crear(0, 8))).toBe(true);
      expect(Marca.crear(0, 8).superaA(Marca.crear(0, 8))).toBe(false);
    });
  });

  describe('creación', () => {
    it('desde los VOs de una serie conserva sus valores', () => {
      const marca = Marca.desdeSerie(Peso.crear(62.5), Repeticiones.crear(8));

      expect(marca.peso).toBe(62.5);
      expect(marca.repeticiones).toBe(8);
    });

    it('valida con las reglas de la serie (RN4 y RN5)', () => {
      expect(() => Marca.crear(-5, 8)).toThrow(
        new DomainException('El peso no puede ser negativo.'),
      );
      expect(() => Marca.crear(60, 0)).toThrow(
        new DomainException('Las repeticiones tienen que ser mayores a 0.'),
      );
    });

    it('es inmutable', () => {
      expect(Object.isFrozen(Marca.crear(60, 8))).toBe(true);
    });
  });
});
