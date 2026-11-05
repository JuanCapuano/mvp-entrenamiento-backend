import { SesionEntrenamientoFactory } from '../factories/sesion-entrenamiento.factory';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';

describe('SesionEntrenamiento (RN1, RN2, RN7, RN12)', () => {
  const hoy = '2026-10-21';
  const peso = Peso.crear(62.5);
  const reps = Repeticiones.crear(8);
  const rir = RIR.crear(2);
  const crear = () =>
    new SesionEntrenamientoFactory().crear(3, 1, 1, hoy, 1, peso, reps, rir);

  it('nace con la primera serie y numera por ejercicio dentro de la sesión', () => {
    const sesion = crear();
    expect(sesion.fecha).toBe(hoy);
    expect(sesion.series).toHaveLength(1);
    expect(sesion.series[0].numeroSerie).toBe(1);
    expect(sesion.registrarSerie(3, hoy, 1, peso, reps, rir).numeroSerie).toBe(
      2,
    );
    expect(sesion.registrarSerie(3, hoy, 2, peso, reps, rir).numeroSerie).toBe(
      1,
    );
    expect(sesion.registrarSerie(3, hoy, 1, peso, reps, rir).numeroSerie).toBe(
      3,
    );
    const copia = [...sesion.series];
    copia.pop();
    expect(sesion.series).toHaveLength(4);
  });
  it('rechaza otro dueño sin modificar la sesión', () => {
    const sesion = crear();
    expect(() => sesion.registrarSerie(4, hoy, 1, peso, reps, rir)).toThrow(
      'Solo el dueño de la sesión puede registrar series.',
    );
    expect(sesion.series).toHaveLength(1);
  });
  it.each(['2026-10-20', '2026-10-22'])(
    'rechaza registrar fuera del día: %s',
    (fecha) => {
      const sesion = crear();
      expect(() => sesion.registrarSerie(3, fecha, 1, peso, reps, rir)).toThrow(
        'Las series se registran siempre con la fecha del día.',
      );
      expect(sesion.series).toHaveLength(1);
    },
  );
});
