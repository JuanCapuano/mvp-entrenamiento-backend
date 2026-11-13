import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../value-objects/rango-repeticiones.vo';
import { Rutina } from './rutina.entity';

const dosificacion = (ejercicioId: number, orden: number) =>
  Dosificacion.crear(ejercicioId, orden, 3, RangoRepeticiones.crear(8, 10), 2);

describe('Rutina', () => {
  it('se crea con nombre y al menos un ejercicio', () => {
    const rutina = Rutina.crear('Piernas', [dosificacion(1, 1)]);
    expect(rutina.nombre).toBe('Piernas');
    expect(rutina.dosificaciones).toHaveLength(1);
  });

  it.each(['', '   '])('rechaza el nombre vacío %p', (nombre) => {
    expect(() => Rutina.crear(nombre, [dosificacion(1, 1)])).toThrow(
      new DomainException('La rutina tiene que tener un nombre.'),
    );
  });

  it('rechaza una rutina sin ejercicios (RN10)', () => {
    expect(() => Rutina.crear('Piernas', [])).toThrow(
      new DomainException('La rutina tiene que tener al menos un ejercicio.'),
    );
  });

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

  it('rechaza un orden repetido', () => {
    expect(() =>
      Rutina.crear('Piernas', [dosificacion(1, 1), dosificacion(2, 1)]),
    ).toThrow(DomainException);
  });

  it('rechaza un orden que no empieza en 1', () => {
    expect(() =>
      Rutina.crear('Piernas', [dosificacion(1, 2), dosificacion(2, 3)]),
    ).toThrow(DomainException);
  });

  it('deja las dosificaciones ordenadas aunque lleguen desordenadas', () => {
    const rutina = Rutina.crear('Piernas', [
      dosificacion(7, 2),
      dosificacion(9, 1),
    ]);
    expect(rutina.dosificaciones.map((d) => d.ejercicioId)).toEqual([9, 7]);
  });
});
