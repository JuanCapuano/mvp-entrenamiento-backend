import { DomainException } from '../../../common/exceptions/domain-exceptions';
import {
  DatosDosificacion,
  PlanEntrenamientoFactory,
} from './plan-entrenamiento.factory';

const dosificacion = (
  cambios: Partial<DatosDosificacion> = {},
): DatosDosificacion => ({
  ejercicioId: 1,
  orden: 1,
  seriesObjetivo: 3,
  repsMin: 8,
  repsMax: 10,
  rirObjetivo: 2,
  ...cambios,
});

describe('PlanEntrenamientoFactory', () => {
  it('crea el plan "Fuerza" con sus rutinas y dosificaciones', () => {
    const plan = PlanEntrenamientoFactory.crear(1, {
      nombre: 'Fuerza',
      indicaciones: 'Pausa de 2 minutos',
      rutinas: [
        {
          nombre: 'Piernas',
          dosificaciones: [
            dosificacion({ ejercicioId: 1, orden: 1 }),
            dosificacion({ ejercicioId: 2, orden: 2 }),
          ],
        },
        {
          nombre: 'Torso',
          dosificaciones: [dosificacion({ ejercicioId: 3, orden: 1 })],
        },
      ],
    });

    expect(plan.nombre).toBe('Fuerza');
    expect(plan.indicaciones).toBe('Pausa de 2 minutos');
    expect(plan.rutinas.map((r) => r.nombre)).toEqual(['Piernas', 'Torso']);
    const d = plan.rutinas[0].dosificaciones[0];
    expect(d.seriesObjetivo).toBe(3);
    expect(d.rangoRepeticiones.minimo).toBe(8);
    expect(d.rangoRepeticiones.maximo).toBe(10);
    expect(d.rirObjetivo).toBe(2);
  });

  it('permite el mismo ejercicio en distintas rutinas del plan (US-07)', () => {
    expect(() =>
      PlanEntrenamientoFactory.crear(1, {
        nombre: 'Fuerza',
        rutinas: [
          { nombre: 'A', dosificaciones: [dosificacion()] },
          { nombre: 'B', dosificaciones: [dosificacion()] },
        ],
      }),
    ).not.toThrow();
  });

  it('propaga el error de una dosificación inválida', () => {
    expect(() =>
      PlanEntrenamientoFactory.crear(1, {
        nombre: 'Fuerza',
        rutinas: [
          {
            nombre: 'A',
            dosificaciones: [dosificacion({ repsMin: 12, repsMax: 8 })],
          },
        ],
      }),
    ).toThrow(DomainException);
  });

  it('rechaza un plan sin rutinas', () => {
    expect(() =>
      PlanEntrenamientoFactory.crear(1, { nombre: 'Fuerza', rutinas: [] }),
    ).toThrow(
      new DomainException('El plan tiene que tener al menos una rutina.'),
    );
  });
});
