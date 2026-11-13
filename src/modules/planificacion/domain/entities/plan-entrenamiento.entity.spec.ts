import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../value-objects/rango-repeticiones.vo';
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
  });
});
