import { ForbiddenException } from '@nestjs/common';
import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { CorregirSerieUseCase } from './corregir-serie.use-case';

// Datos del Paso 10: hoy, 21/10, Juan (3) registró Sentadilla 62,5 × 8; Sofía (4) es otra deportista
const JUAN_ID = 3;
const SOFIA_ID = 4;
const HOY = '2026-10-21';

describe('CorregirSerieUseCase (US-17, RN17)', () => {
  it('una deportista no puede corregir la serie de otro (403) y no cambia nada', async () => {
    const sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    const eventos = { emit: jest.fn(() => true) };
    const caso = new CorregirSerieUseCase(
      sesiones,
      new DetectorRecordPersonal(),
      eventos,
      () => HOY,
    );
    const guardada = await sesiones.guardar(
      new SesionEntrenamientoFactory().crear(
        JUAN_ID,
        1,
        1,
        HOY,
        1,
        Peso.crear(62.5),
        Repeticiones.crear(8),
        RIR.crear(2),
      ),
    );
    const serieId = guardada.series[0].id;

    await expect(
      caso.execute(SOFIA_ID, serieId, { peso: 65, repeticiones: 8, rir: 2 }),
    ).rejects.toThrow(new ForbiddenException('La serie no es tuya.'));

    const sesion = await sesiones.buscarPorSerie(serieId);
    expect(sesion?.series[0].peso.valor).toBe(62.5);
    expect(eventos.emit).not.toHaveBeenCalled();
  });
});
