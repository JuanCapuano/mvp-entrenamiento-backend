import { SesionEntrenamiento } from '../domain/entities/sesion-entrenamiento.entity';
import { Peso } from '../domain/value-objects/peso.vo';
import { Repeticiones } from '../domain/value-objects/repeticiones.vo';
import { RIR } from '../domain/value-objects/rir.vo';
import { AsistenciaMapper } from './asistencia.mapper';

// Paso 10: el 14/10 Juan hizo Piernas con Sentadilla 60 × 8
const sesion = SesionEntrenamiento.iniciar(
  3,
  1,
  1,
  '2026-10-14',
  1,
  Peso.crear(60),
  Repeticiones.crear(8),
  RIR.crear(2),
);

describe('AsistenciaMapper (US-12)', () => {
  it('devuelve la fecha, la rutina y el cumplimiento de la sesión', () => {
    expect(AsistenciaMapper.aDto(sesion, 'Piernas', 17)).toEqual({
      fecha: '2026-10-14',
      rutina: 'Piernas',
      cumplimiento: 17,
    });
  });

  it('RN17: no expone pesos, repeticiones, RIR ni ids', () => {
    const dto = AsistenciaMapper.aDto(sesion, 'Piernas', 17);

    expect(Object.keys(dto)).toEqual(['fecha', 'rutina', 'cumplimiento']);
  });
});
