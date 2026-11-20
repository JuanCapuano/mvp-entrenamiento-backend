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

const dosificacion = (ejercicioId: number, orden: number) =>
  Dosificacion.crear(ejercicioId, orden, 3, RangoRepeticiones.crear(8, 12), 2);

const rutinaCon = (nombre: string, ...ejercicios: number[]) =>
  Rutina.crear(
    nombre,
    ejercicios.map((ejercicioId, i) => dosificacion(ejercicioId, i + 1)),
  );

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
  describe('PlanEntrenamiento - varias rutinas (US-07)', () => {
    it('un plan puede tener varias rutinas, cada una con su nombre', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [
        rutinaCon('Día 1 - Pierna', 1),
        rutinaCon('Día 2 - Pecho', 2),
      ]);

      expect(plan.rutinas.map((r) => r.nombre)).toEqual([
        'Día 1 - Pierna',
        'Día 2 - Pecho',
      ]);
    });

    it('las rutinas conservan el orden en que se definieron', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [
        rutinaCon('B', 1),
        rutinaCon('A', 2),
        rutinaCon('C', 3),
      ]);

      expect(plan.rutinasOrdenadas().map((r) => [r.nombre, r.orden])).toEqual([
        ['B', 1],
        ['A', 2],
        ['C', 3],
      ]);
    });

    it('rutinasOrdenadas no depende del orden en que cargó la base', () => {
      const plan = PlanEntrenamiento.crear(5, 'Fuerza', null, [
        rutinaCon('B', 1),
        rutinaCon('A', 2),
        rutinaCon('C', 3),
      ]);
      // simula una carga desordenada desde la base
      plan.rutinas = [plan.rutinas[2], plan.rutinas[0], plan.rutinas[1]];

      expect(plan.rutinasOrdenadas().map((r) => r.nombre)).toEqual([
        'B',
        'A',
        'C',
      ]);
    });

    it('los ejercicios de cada rutina se muestran en el orden definido', () => {
      const r = Rutina.crear('Día 1', [
        dosificacion(30, 1),
        dosificacion(10, 2),
        dosificacion(20, 3),
      ]);

      expect(
        r.dosificacionesOrdenadas().map((d) => [d.ejercicioId, d.orden]),
      ).toEqual([
        [30, 1],
        [10, 2],
        [20, 3],
      ]);
    });

    it('ordena los ejercicios aunque lleguen desordenados', () => {
      const r = Rutina.crear('Día 1', [
        dosificacion(20, 2),
        dosificacion(30, 3),
        dosificacion(10, 1),
      ]);

      expect(r.dosificacionesOrdenadas().map((d) => d.ejercicioId)).toEqual([
        10, 20, 30,
      ]);
    });

    it('un mismo ejercicio puede estar en distintas rutinas del plan', () => {
      expect(() =>
        PlanEntrenamiento.crear(5, 'Fuerza', null, [
          rutinaCon('Día 1', 1, 2),
          rutinaCon('Día 2', 1, 3),
        ]),
      ).not.toThrow();
    });

    it('RN15: no se puede repetir un ejercicio dentro de la misma rutina', () => {
      expect(() => rutinaCon('Día 1', 1, 2, 1)).toThrow(
        new DomainException(
          'El ejercicio no puede repetirse dentro de la rutina.',
        ),
      );
    });

    it('rechaza un orden de ejercicios con huecos', () => {
      expect(() =>
        Rutina.crear('Día 1', [dosificacion(1, 1), dosificacion(2, 3)]),
      ).toThrow(
        new DomainException(
          'El orden de los ejercicios tiene que ser correlativo, empezando en 1.',
        ),
      );
    });
  });
});
