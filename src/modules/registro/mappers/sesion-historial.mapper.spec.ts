import { SesionEntrenamientoFactory } from '../domain/factories/sesion-entrenamiento.factory';
import { CalculadoraCumplimiento } from '../domain/services/calculadora-cumplimiento.service';
import { Peso } from '../domain/value-objects/peso.vo';
import { Repeticiones } from '../domain/value-objects/repeticiones.vo';
import { RIR } from '../domain/value-objects/rir.vo';
import { SesionHistorialMapper } from './sesion-historial.mapper';

const FECHA = '2026-10-14';
const SENTADILLA = 1;
const PESO_MUERTO = 2;

// Sesión de Piernas del 14/10 con dos series de Sentadilla y ninguna de Peso muerto
function sesionDePiernas() {
  const sesion = new SesionEntrenamientoFactory().crear(
    3,
    1,
    10,
    FECHA,
    SENTADILLA,
    Peso.crear(60),
    Repeticiones.crear(8),
    RIR.crear(2),
  );
  sesion.registrarSerie(
    3,
    FECHA,
    SENTADILLA,
    Peso.crear(62.5),
    Repeticiones.crear(6),
    RIR.crear(1),
  );
  return sesion;
}

const nombres = new Map([
  [SENTADILLA, 'Sentadilla'],
  [PESO_MUERTO, 'Peso muerto'],
]);

describe('SesionHistorialMapper (US-20)', () => {
  it('muestra fecha, rutina y las series agrupadas por ejercicio en el orden de la rutina', () => {
    const dto = SesionHistorialMapper.aDto(
      sesionDePiernas(),
      {
        nombre: 'Piernas',
        // Desordenadas a propósito: manda el orden de la rutina
        dosificaciones: [
          { ejercicioId: PESO_MUERTO, orden: 2, seriesObjetivo: 3 },
          { ejercicioId: SENTADILLA, orden: 1, seriesObjetivo: 4 },
        ],
      },
      nombres,
      new CalculadoraCumplimiento(),
    );

    expect(dto).toEqual({
      fecha: FECHA,
      rutina: 'Piernas',
      // 2 de 7 series objetivo
      cumplimiento: 29,
      ejercicios: [
        {
          nombre: 'Sentadilla',
          cumplimiento: 50,
          series: [
            { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
            { numero: 2, peso: 62.5, repeticiones: 6, rir: 1 },
          ],
        },
        { nombre: 'Peso muerto', cumplimiento: 0, series: [] },
      ],
    });
  });

  it('si no encuentra la rutina, la sesión sale sin nombre de rutina ni ejercicios', () => {
    expect(
      SesionHistorialMapper.aDto(
        sesionDePiernas(),
        null,
        nombres,
        new CalculadoraCumplimiento(),
      ),
    ).toEqual({ fecha: FECHA, rutina: '', cumplimiento: 0, ejercicios: [] });
  });
});
