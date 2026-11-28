import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../value-objects/rango-repeticiones.vo';
import { Rutina } from './rutina.entity';

const dosificacion = (ejercicioId: number, orden: number) =>
  Dosificacion.crear(ejercicioId, orden, 3, RangoRepeticiones.crear(8, 10), 2);

describe('Rutina', () => {
  it('rechaza un ejercicio repetido en la misma rutina (RN15)', () => {
    expect(() =>
      Rutina.crear('Piernas', [dosificacion(1, 1), dosificacion(1, 2)]),
    ).toThrow(
      new DomainException(
        'El ejercicio no puede repetirse dentro de la rutina.',
      ),
    );
  });

  it('rechaza un orden con huecos', () => {
    expect(() =>
      Rutina.crear('Piernas', [dosificacion(1, 1), dosificacion(2, 3)]),
    ).toThrow(
      new DomainException(
        'El orden de los ejercicios tiene que ser correlativo, empezando en 1.',
      ),
    );
  });
});
