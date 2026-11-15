import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { RecordPersonalSuperado } from '../../domain/events/record-personal-superado.event';
import { SerieCorregida } from '../../domain/events/serie-corregida.event';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { CorregirSerieUseCase } from './corregir-serie.use-case';

// Datos del Paso 10: Juan (3) hizo Sentadilla 60 × 8 el 14/10 y hoy, 21/10, registró 62,5 × 8
const JUAN_ID = 3;
const SOFIA_ID = 4;
const HOY = '2026-10-21';
const PIERNAS = 1;
const SENTADILLA = 1;

type DatosSerie = [peso: number, repeticiones: number, rir: number];

describe('CorregirSerieUseCase (US-17)', () => {
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let eventos: { emit: jest.Mock };
  let caso: CorregirSerieUseCase;
  let hoy: string;

  beforeEach(() => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    eventos = { emit: jest.fn(() => true) };
    hoy = HOY;
    caso = new CorregirSerieUseCase(
      sesiones,
      new DetectorRecordPersonal(),
      eventos,
      () => hoy,
    );
  });

  // Guarda una sesión de Sentadilla y devuelve los ids de sus series, en orden
  async function guardarSesion(
    deportistaId: number,
    fecha: string,
    series: DatosSerie[],
  ): Promise<number[]> {
    const vo = ([peso, repeticiones, rir]: DatosSerie) =>
      [
        Peso.crear(peso),
        Repeticiones.crear(repeticiones),
        RIR.crear(rir),
      ] as const;
    const [primera, ...resto] = series;
    const sesion = new SesionEntrenamientoFactory().crear(
      deportistaId,
      1,
      PIERNAS,
      fecha,
      SENTADILLA,
      ...vo(primera),
    );
    for (const serie of resto) {
      sesion.registrarSerie(deportistaId, fecha, SENTADILLA, ...vo(serie));
    }
    const guardada = await sesiones.guardar(sesion);
    return guardada.series.map((serie) => serie.id);
  }

  const serieGuardada = async (serieId: number) =>
    (await sesiones.buscarPorSerie(serieId))?.series.find(
      (serie) => serie.id === serieId,
    );

  it('E6: corrige la serie de hoy a 65 kg × 8 y avisa el récord personal superado', async () => {
    await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    const respuesta = await caso.execute(JUAN_ID, serieId, {
      peso: 65,
      repeticiones: 8,
      rir: 2,
    });

    expect(respuesta).toEqual({ serie_id: serieId, record_personal: true });
    const guardada = await serieGuardada(serieId);
    expect(guardada?.peso.valor).toBe(65);
    expect(guardada?.repeticiones.valor).toBe(8);
  });

  it('la serie corregida conserva su número', async () => {
    const [, segunda] = await guardarSesion(JUAN_ID, HOY, [
      [62.5, 8, 2],
      [62.5, 7, 1],
    ]);

    await caso.execute(JUAN_ID, segunda, { peso: 60, repeticiones: 8, rir: 2 });

    const guardada = await serieGuardada(segunda);
    expect(guardada?.numeroSerie).toBe(2);
    expect(guardada?.ejercicioId).toBe(SENTADILLA);
    expect(
      (await sesiones.buscarDelDia(JUAN_ID, PIERNAS, HOY))?.series,
    ).toHaveLength(2);
  });

  it('E7: no se puede corregir una serie de otro día y no cambia nada', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);

    await expect(
      caso.execute(JUAN_ID, serieId, { peso: 65, repeticiones: 8, rir: 2 }),
    ).rejects.toThrow(
      new DomainException('Solo se puede corregir el mismo día.'),
    );

    expect((await serieGuardada(serieId))?.peso.valor).toBe(60);
    expect(eventos.emit).not.toHaveBeenCalled();
  });

  it('solo el deportista que la registró puede corregirla (403) y no cambia nada', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    await expect(
      caso.execute(SOFIA_ID, serieId, { peso: 65, repeticiones: 8, rir: 2 }),
    ).rejects.toThrow(new ForbiddenException('La serie no es tuya.'));

    expect((await serieGuardada(serieId))?.peso.valor).toBe(62.5);
    expect(eventos.emit).not.toHaveBeenCalled();
  });

  it('404 si la serie no existe', async () => {
    await expect(
      caso.execute(JUAN_ID, 999, { peso: 65, repeticiones: 8, rir: 2 }),
    ).rejects.toThrow(new NotFoundException('La serie no existe.'));
  });

  it.each([
    [{ repeticiones: 0 }, 'Las repeticiones tienen que ser mayores a 0.'],
    [{ peso: -5 }, 'El peso no puede ser negativo.'],
    [{ rir: -1 }, 'El RIR no puede ser negativo.'],
  ])(
    'los valores corregidos cumplen las mismas condiciones que al registrar: %j',
    async (cambios, mensaje) => {
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      await expect(
        caso.execute(JUAN_ID, serieId, {
          peso: 65,
          repeticiones: 8,
          rir: 2,
          ...cambios,
        }),
      ).rejects.toThrow(new DomainException(mensaje));

      expect((await serieGuardada(serieId))?.peso.valor).toBe(62.5);
      expect(eventos.emit).not.toHaveBeenCalled();
    },
  );

  it('acepta peso 0 (peso corporal) y RIR 0', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    await caso.execute(JUAN_ID, serieId, { peso: 0, repeticiones: 12, rir: 0 });

    const guardada = await serieGuardada(serieId);
    expect(guardada?.peso.valor).toBe(0);
    expect(guardada?.rir.valor).toBe(0);
  });

  describe('récord personal al corregir (RN9)', () => {
    it('no hay récord si el valor corregido no supera la mejor marca', async () => {
      await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      const respuesta = await caso.execute(JUAN_ID, serieId, {
        peso: 57.5,
        repeticiones: 8,
        rir: 2,
      });

      expect(respuesta.record_personal).toBe(false);
    });

    it('a igual peso, supera el récord con más repeticiones', async () => {
      await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[55, 8, 2]]);

      const respuesta = await caso.execute(JUAN_ID, serieId, {
        peso: 60,
        repeticiones: 9,
        rir: 1,
      });

      expect(respuesta.record_personal).toBe(true);
    });

    it('la primera vez que hace el ejercicio no cuenta como récord', async () => {
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      const respuesta = await caso.execute(JUAN_ID, serieId, {
        peso: 100,
        repeticiones: 8,
        rir: 2,
      });

      expect(respuesta.record_personal).toBe(false);
    });

    it('no se compara con su propio valor anterior, sí con las otras series de hoy', async () => {
      const [primera] = await guardarSesion(JUAN_ID, HOY, [
        [62.5, 8, 2],
        [65, 8, 2],
      ]);

      // Supera a su valor anterior (62,5) pero no a la otra serie de hoy (65)
      const sinRecord = await caso.execute(JUAN_ID, primera, {
        peso: 64,
        repeticiones: 8,
        rir: 2,
      });
      const conRecord = await caso.execute(JUAN_ID, primera, {
        peso: 67.5,
        repeticiones: 8,
        rir: 2,
      });

      expect(sinRecord.record_personal).toBe(false);
      expect(conRecord.record_personal).toBe(true);
    });

    it('las marcas de otro deportista no cuentan', async () => {
      await guardarSesion(SOFIA_ID, '2026-10-14', [[100, 8, 2]]);
      await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[55, 8, 2]]);

      const respuesta = await caso.execute(JUAN_ID, serieId, {
        peso: 65,
        repeticiones: 8,
        rir: 2,
      });

      expect(respuesta.record_personal).toBe(true);
    });
  });

  describe('eventos', () => {
    it('publica Serie corregida después de guardar', async () => {
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      await caso.execute(JUAN_ID, serieId, {
        peso: 60,
        repeticiones: 8,
        rir: 2,
      });

      expect(eventos.emit).toHaveBeenCalledTimes(1);
      const [nombre, evento] = eventos.emit.mock.calls[0];
      expect(nombre).toBe('serie.corregida');
      expect(evento).toBeInstanceOf(SerieCorregida);
      expect(evento).toMatchObject({
        deportistaId: JUAN_ID,
        serieId,
        ejercicioId: SENTADILLA,
        fecha: HOY,
      });
    });

    it('si supera el récord publica también Récord personal superado con el valor corregido', async () => {
      await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      await caso.execute(JUAN_ID, serieId, {
        peso: 65,
        repeticiones: 8,
        rir: 2,
      });

      expect(eventos.emit.mock.calls.map(([nombre]) => nombre)).toEqual([
        'serie.corregida',
        'record-personal.superado',
      ]);
      const record = eventos.emit.mock.calls[1][1];
      expect(record).toBeInstanceOf(RecordPersonalSuperado);
      expect(record).toMatchObject({ peso: 65, repeticiones: 8, serieId });
    });
  });
});
