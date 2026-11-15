import { RegistrarSerieUseCase } from './registrar-serie.use-case';
import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { PlanRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/plan.repository-en-memoria';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { VerificadorEjercicioPlanVigente } from '../../domain/services/verificador-ejercicio-plan-vigente.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { RegistroConcurrenteException } from '../../domain/exceptions/registro-concurrente.exception';
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
          (rutina === 1 && [1, 2].includes(ejercicio)) ||
          (rutina === 2 && ejercicio === 3),
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

  it('E2/E3: crea la sesión, detecta el récord y agrega la segunda serie sin otro récord', async () => {
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
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.fecha).toBe(hoy);
    const segunda = await caso.execute(3, { ...dto, repeticiones: 7, rir: 1 });
    expect(segunda).toEqual({ serie_id: 3, numero: 2, record_personal: false });
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.series).toHaveLength(2);
    expect(eventos.emit.mock.calls.map(([nombre]) => nombre)).toEqual([
      'serie.registrada',
      'record-personal.superado',
      'serie.registrada',
    ]);
  });
  it('separa rutinas y numera cada ejercicio desde uno', async () => {
    expect((await caso.execute(3, dto)).record_personal).toBe(false);
    expect(
      (await caso.execute(3, { ...dto, ejercicio_id: 2, peso: 0 })).numero,
    ).toBe(1);
    expect(
      (await caso.execute(3, { ...dto, rutina_id: 2, ejercicio_id: 3 })).numero,
    ).toBe(1);
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.id).not.toBe(
      (await sesiones.buscarDelDia(3, 2, hoy))?.id,
    );
  });
  it.each([
    [{ repeticiones: 0 }, 'Las repeticiones tienen que ser mayores a 0.'],
    [{ peso: -5 }, 'El peso no puede ser negativo.'],
    [{ rir: -1 }, 'El RIR no puede ser negativo.'],
    [
      { ejercicio_id: 3 },
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    ],
    [
      { rutina_id: 99 },
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    ],
  ])('rechaza %j sin persistir ni publicar', async (cambios, mensaje) => {
    await expect(caso.execute(3, { ...dto, ...cambios })).rejects.toThrow(
      mensaje,
    );
    expect(await sesiones.buscarDelDia(3, 1, hoy)).toBeNull();
    expect(eventos.emit).not.toHaveBeenCalled();
  });
  it.each([4, 3])(
    'rechaza un plan ajeno o vencido para deportista %s',
    async (deportista) => {
      planes.asignaciones[0].hasta = '2026-10-20';
      await expect(caso.execute(deportista, dto)).rejects.toThrow(
        'No tenés un plan vigente.',
      );
      expect(eventos.emit).not.toHaveBeenCalled();
    },
  );
  it('los registros de otro deportista no cuentan para el récord', async () => {
    await sesiones.guardar(
      factory.crear(
        4,
        1,
        1,
        '2026-10-14',
        1,
        Peso.crear(10),
        Repeticiones.crear(8),
        RIR.crear(2),
      ),
    );
    expect((await caso.execute(3, dto)).record_personal).toBe(false);
  });
  it('no modifica una sesión ajena aunque el repositorio la devuelva por error', async () => {
    jest
      .spyOn(sesiones, 'buscarDelDia')
      .mockResolvedValue(
        factory.crear(
          4,
          1,
          1,
          hoy,
          1,
          Peso.crear(60),
          Repeticiones.crear(8),
          RIR.crear(2),
        ),
      );
    await expect(caso.execute(3, dto)).rejects.toThrow(
      'La sesión pertenece a otro deportista.',
    );
    expect(eventos.emit).not.toHaveBeenCalled();
  });
  it('no publica eventos si falla guardar', async () => {
    jest
      .spyOn(sesiones, 'guardar')
      .mockRejectedValue(new Error('Base no disponible'));
    await expect(caso.execute(3, dto)).rejects.toThrow('Base no disponible');
    expect(eventos.emit).not.toHaveBeenCalled();
  });
  it('publica solo después de persistir', async () => {
    const guardar = jest.spyOn(sesiones, 'guardar');
    await caso.execute(3, dto);
    expect(guardar.mock.invocationCallOrder[0]).toBeLessThan(
      eventos.emit.mock.invocationCallOrder[0],
    );
  });
  it('reintenta las colisiones de unicidad sin publicar intentos fallidos', async () => {
    jest
      .spyOn(sesiones, 'guardar')
      .mockRejectedValueOnce(new RegistroConcurrenteException());
    expect((await caso.execute(3, dto)).numero).toBe(1);
    expect(eventos.emit).toHaveBeenCalledTimes(1);
  });
  it('limita los reintentos de concurrencia', async () => {
    const guardar = jest
      .spyOn(sesiones, 'guardar')
      .mockRejectedValue(new RegistroConcurrenteException());
    await expect(caso.execute(3, dto)).rejects.toThrow(
      'Se registraron series simultáneamente. Volvé a intentar.',
    );
    expect(guardar).toHaveBeenCalledTimes(3);
    expect(eventos.emit).not.toHaveBeenCalled();
  });
  it('dos solicitudes simultáneas conservan una sesión con números distintos', async () => {
    const respuestas = await Promise.all([
      caso.execute(3, dto),
      caso.execute(3, dto),
    ]);
    expect(respuestas.map((serie) => serie.numero).sort()).toEqual([1, 2]);
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.series).toHaveLength(2);
  });

  it('al día siguiente crea otra sesión y reinicia la numeración', async () => {
    await caso.execute(3, dto);
    const otroDia = new RegistrarSerieUseCase(
      sesiones,
      planes,
      factory,
      new VerificadorEjercicioPlanVigente(),
      new DetectorRecordPersonal(),
      eventos,
      () => '2026-10-22',
    );
    expect((await otroDia.execute(3, dto)).numero).toBe(1);
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.id).not.toBe(
      (await sesiones.buscarDelDia(3, 1, '2026-10-22'))?.id,
    );
  });

  it('rechaza planes cuya vigencia todavía no comenzó', async () => {
    planes.asignaciones[0].desde = '2026-10-22';
    await expect(caso.execute(3, dto)).rejects.toThrow(
      'No tenés un plan vigente.',
    );
  });

  it('un intento inválido conserva las series existentes y su próximo número', async () => {
    await caso.execute(3, dto);
    await expect(caso.execute(3, { ...dto, peso: -5 })).rejects.toThrow(
      'El peso no puede ser negativo.',
    );
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.series).toHaveLength(1);
    expect((await caso.execute(3, dto)).numero).toBe(2);
  });

  it('dos ejercicios concurrentes conservan sus series en la misma sesión', async () => {
    await caso.execute(3, dto);
    await Promise.all([
      caso.execute(3, dto),
      caso.execute(3, { ...dto, ejercicio_id: 2 }),
    ]);
    const sesion = await sesiones.buscarDelDia(3, 1, hoy);
    expect(
      sesion?.series
        .map((serie) => [serie.ejercicioId, serie.numeroSerie])
        .sort(),
    ).toEqual([
      [1, 1],
      [1, 2],
      [2, 1],
    ]);
  });
});
