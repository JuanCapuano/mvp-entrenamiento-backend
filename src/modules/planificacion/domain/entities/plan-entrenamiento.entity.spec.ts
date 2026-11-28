import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../value-objects/rango-repeticiones.vo';
import { Vigencia } from '../value-objects/vigencia.vo';
import { PlanEntrenamiento } from './plan-entrenamiento.entity';
import { Rutina } from './rutina.entity';

const rutina = () =>
  Rutina.crear('Piernas', [
    Dosificacion.crear(1, 1, 3, RangoRepeticiones.crear(8, 10), 2),
  ]);

describe('PlanEntrenamiento', () => {
  it('se crea con nombre y al menos una rutina', () => {
    const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]);
    expect(plan.entrenadorId).toBe(5);
    expect(plan.nombre).toBe('Fuerza');
    expect(plan.rutinas).toHaveLength(1);
  });

  it('rechaza un plan sin rutinas (RN10)', () => {
    expect(() => PlanEntrenamiento.crear(5, 'Fuerza', null, [])).toThrow(
      new DomainException('El plan tiene que tener al menos una rutina.'),
    );
  });

  it('rechaza un plan con más de 7 rutinas', () => {
    const rutinas = Array.from({ length: 8 }, () => rutina());
    expect(() => PlanEntrenamiento.crear(5, 'Fuerza', null, rutinas)).toThrow(
      new DomainException('El plan puede tener hasta 7 rutinas.'),
    );
  });

  describe('agregarAsignacion (US-08)', () => {
    it('un mismo plan se asigna a varios deportistas, cada uno con sus fechas', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]);

      plan.agregarAsignacion(10, Vigencia.crear('2026-10-01', '2026-11-30'));
      plan.agregarAsignacion(11, Vigencia.crear('2026-10-15', '2026-12-15'));

      expect(plan.asignaciones.map((a) => a.deportistaId)).toEqual([10, 11]);
      expect(plan.asignaciones[1].vigencia.desde).toBe('2026-10-15');
    });
  });
});
