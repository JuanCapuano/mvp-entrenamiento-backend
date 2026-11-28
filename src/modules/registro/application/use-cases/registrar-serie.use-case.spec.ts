import { RegistrarSerieUseCase } from './registrar-serie.use-case';
import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { PlanRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/plan.repository-en-memoria';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { VerificadorEjercicioPlanVigente } from '../../domain/services/verificador-ejercicio-plan-vigente.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { SerieRegistrada } from '../../domain/events/serie-registrada.event';
import { RecordPersonalSuperado } from '../../domain/events/record-personal-superado.event';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';

describe('RegistrarSerieUseCase US-15', () => {
  const hoy = '2026-10-21';
  const dto = {
    rutina_id: 1,
    ejercicio_id: 1,
    peso: 62.5,
    repeticiones: 8,
    rir: 2,
  };
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let planes: PlanRepositoryEnMemoria;
  let eventos: { emit: jest.Mock };
  let caso: RegistrarSerieUseCase;
  const factory = new SesionEntrenamientoFactory();

  beforeEach(() => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    planes = new PlanRepositoryEnMemoria();
    planes.asignaciones.push({
      deportistaId: 3,
      desde: '2026-10-01',
      hasta: '2026-11-30',
      plan: {
        id: 1,
        contieneEjercicio: (rutina, ejercicio) =>
          rutina === 1 && [1, 2].includes(ejercicio),
      },
    });
    eventos = { emit: jest.fn(() => true) };
    caso = new RegistrarSerieUseCase(
      sesiones,
      planes,
      factory,
      new VerificadorEjercicioPlanVigente(),
      new DetectorRecordPersonal(),
      eventos,
      () => hoy,
    );
  });

  it('E2/E3: publica Serie registrada en cada serie y Récord personal superado solo cuando lo supera', async () => {
    await sesiones.guardar(
      factory.crear(
        3,
        1,
        1,
        '2026-10-14',
        1,
        Peso.crear(60),
        Repeticiones.crear(8),
        RIR.crear(2),
      ),
    );
    const primera = await caso.execute(3, dto);
    expect(primera).toEqual({ serie_id: 2, numero: 1, record_personal: true });
    const segunda = await caso.execute(3, { ...dto, repeticiones: 7, rir: 1 });
    expect(segunda).toEqual({ serie_id: 3, numero: 2, record_personal: false });

    expect(eventos.emit.mock.calls.map(([nombre]) => nombre)).toEqual([
      'serie.registrada',
      'record-personal.superado',
      'serie.registrada',
    ]);
    const sesionId = (await sesiones.buscarDelDia(3, 1, hoy))!.id;
    expect(eventos.emit.mock.calls[0][1]).toEqual(
      new SerieRegistrada(3, sesionId, 2, 1, hoy),
    );
    expect(eventos.emit.mock.calls[1][1]).toEqual(
      new RecordPersonalSuperado(3, 1, 2, 62.5, 8, hoy),
    );
  });

  it('no publica eventos si falla guardar', async () => {
    jest
      .spyOn(sesiones, 'guardar')
      .mockRejectedValue(new Error('Base no disponible'));
    await expect(caso.execute(3, dto)).rejects.toThrow('Base no disponible');
    expect(eventos.emit).not.toHaveBeenCalled();
  });

  it('sin plan vigente no guarda ni publica (RN3)', async () => {
    planes.asignaciones[0].hasta = '2026-10-20';
    await expect(caso.execute(3, dto)).rejects.toThrow(
      'No tenés un plan vigente.',
    );
    expect(await sesiones.buscarDelDia(3, 1, hoy)).toBeNull();
    expect(eventos.emit).not.toHaveBeenCalled();
  });
});
