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

  it.each(['', '   '])('rechaza el nombre vacío %p', (nombre) => {
    expect(() => PlanEntrenamiento.crear(5, nombre, null, [rutina()])).toThrow(
      new DomainException('El plan tiene que tener un nombre.'),
    );
  });

  it('rechaza un plan sin rutinas (RN10)', () => {
    expect(() => PlanEntrenamiento.crear(5, 'Fuerza', null, [])).toThrow(
      new DomainException('El plan tiene que tener al menos una rutina.'),
    );
  });

  it('las indicaciones son opcionales', () => {
    expect(
      PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]).indicaciones,
    ).toBeNull();
    expect(
      PlanEntrenamiento.crear(5, 'Fuerza', '   ', [rutina()]).indicaciones,
    ).toBeNull();
  });

  it('guarda las indicaciones cuando vienen', () => {
    const plan = PlanEntrenamiento.crear(5, 'Fuerza', ' Entrada en calor ', [
      rutina(),
    ]);
    expect(plan.indicaciones).toBe('Entrada en calor');
  });

  it('se crea sin asignarlo a ningún deportista', () => {
    const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]);
    expect(plan.id).toBeUndefined();
    expect(plan.asignaciones).toEqual([]);
  });

  describe('agregarAsignacion (US-08)', () => {
    it('asigna el plan a un deportista con su vigencia', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]);
      const vigencia = Vigencia.crear('2026-10-01', '2026-11-30');

      const asignacion = plan.agregarAsignacion(10, vigencia);

      expect(asignacion.deportistaId).toBe(10);
      expect(asignacion.vigencia).toBe(vigencia);
      expect(plan.asignaciones).toEqual([asignacion]);
    });

    it('un mismo plan se asigna a varios deportistas, cada uno con sus fechas', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [rutina()]);

      plan.agregarAsignacion(10, Vigencia.crear('2026-10-01', '2026-11-30'));
      plan.agregarAsignacion(11, Vigencia.crear('2026-10-15', '2026-12-15'));

      expect(plan.asignaciones.map((a) => a.deportistaId)).toEqual([10, 11]);
      expect(plan.asignaciones[1].vigencia.desde).toBe('2026-10-15');
    });
  });
});
