import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import request from 'supertest';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { RolNombre } from '../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { IPlanRepositoryToken } from '../src/modules/planificacion/domain/interfaces/plan.repository-interface';
import { ISesionEntrenamientoRepositoryToken } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import { IPublicadorEventosRegistroToken } from '../src/modules/registro/application/publicador-eventos-registro.interface';
import {
  FECHA_ACTUAL_REGISTRO,
  RegistrarSerieUseCase,
} from '../src/modules/registro/application/use-cases/registrar-serie.use-case';
import { CorregirSerieUseCase } from '../src/modules/registro/application/use-cases/corregir-serie.use-case';
import { SeriesController } from '../src/modules/registro/application/controllers/series.controller';
import { SesionEntrenamientoFactory } from '../src/modules/registro/domain/factories/sesion-entrenamiento.factory';
import { VerificadorEjercicioPlanVigente } from '../src/modules/registro/domain/services/verificador-ejercicio-plan-vigente.service';
import { DetectorRecordPersonal } from '../src/modules/registro/domain/services/detector-record-personal.service';
import { RecordPersonalSuperado } from '../src/modules/registro/domain/events/record-personal-superado.event';
import { Peso } from '../src/modules/registro/domain/value-objects/peso.vo';
import { Repeticiones } from '../src/modules/registro/domain/value-objects/repeticiones.vo';
import { RIR } from '../src/modules/registro/domain/value-objects/rir.vo';
import { SesionEntrenamientoRepositoryEnMemoria } from './repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { PlanRepositoryEnMemoria } from './repositorios-en-memoria/plan.repository-en-memoria';

// HTTP, guard JWT, casos de uso, dominio y EventEmitter2 reales.
// Persistencia y planificación por sus interfaces en memoria; no modifica MySQL.
describe('US-18: aviso de récord personal (RN9)', () => {
  const HOY = '2026-10-21';
  const JUAN = 3;
  const SOFIA = 4;
  const entrada = {
    rutina_id: 1,
    ejercicio_id: 1,
    peso: 62.5,
    repeticiones: 8,
    rir: 2,
  };
  let app: INestApplication;
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let emisor: EventEmitter2;
  let emitir: jest.SpiedFunction<EventEmitter2['emit']>;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenEntrenador: string;

  beforeEach(async () => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    const planes = new PlanRepositoryEnMemoria();
    for (const deportistaId of [JUAN, SOFIA]) {
      planes.asignaciones.push({
        deportistaId,
        desde: '2026-10-01',
        hasta: '2026-11-30',
        plan: {
          id: 1,
          contieneEjercicio: (rutinaId, ejercicioId) =>
            rutinaId === 1 && ejercicioId === 1,
        },
      });
    }
    emisor = new EventEmitter2();
    emitir = jest.spyOn(emisor, 'emit');
    const modulo = await Test.createTestingModule({
      controllers: [SeriesController],
      providers: [
        RegistrarSerieUseCase,
        CorregirSerieUseCase,
        SesionEntrenamientoFactory,
        DetectorRecordPersonal,
        VerificadorEjercicioPlanVigente,
        JwtService,
        { provide: ISesionEntrenamientoRepositoryToken, useValue: sesiones },
        { provide: IPlanRepositoryToken, useValue: planes },
        { provide: IPublicadorEventosRegistroToken, useValue: emisor },
        { provide: FECHA_ACTUAL_REGISTRO, useValue: () => HOY },
        {
          provide: ConfigService,
          useValue: new ConfigService({
            JWT_SECRET: 'us18-secreto-solo-pruebas',
          }),
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();
    const jwt = modulo.get(JwtService);
    const firmar = (sub: number, rol: RolNombre) =>
      jwt.signAsync({ sub, rol }, { secret: 'us18-secreto-solo-pruebas' });
    tokenJuan = await firmar(JUAN, RolNombre.DEPORTISTA);
    tokenSofia = await firmar(SOFIA, RolNombre.DEPORTISTA);
    tokenEntrenador = await firmar(1, RolNombre.ENTRENADOR);
    app = modulo.createNestApplication();
    app.useLogger(false);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });
  afterEach(async () => {
    await app?.close();
  });

  async function guardarMarca(
    peso: number,
    repeticiones = 8,
    deportistaId = JUAN,
    ejercicioId = 1,
    rutinaId = 1,
  ) {
    return sesiones.guardar(
      new SesionEntrenamientoFactory().crear(
        deportistaId,
        1,
        rutinaId,
        '2026-10-14',
        ejercicioId,
        Peso.crear(peso),
        Repeticiones.crear(repeticiones),
        RIR.crear(2),
      ),
    );
  }
  const registrar = (valores = entrada, token = tokenJuan) =>
    request(app.getHttpServer())
      .post('/api/series')
      .auth(token, { type: 'bearer' })
      .send(valores);
  const corregir = (
    id: number,
    valores: { peso: number; repeticiones: number; rir: number },
    token = tokenJuan,
  ) =>
    request(app.getHttpServer())
      .patch(`/api/series/${id}`)
      .auth(token, { type: 'bearer' })
      .send(valores);
  const records = () =>
    emitir.mock.calls
      .filter(([nombre]) => nombre === 'record-personal.superado')
      .map(([, evento]) => evento as RecordPersonalSuperado);

  it('E2 → E3 → E6: registra, evita el aviso en la segunda serie y revisa el récord al corregir', async () => {
    await guardarMarca(60);
    const guardar = jest.spyOn(sesiones, 'guardar');
    const primera = await registrar().expect(201);
    expect(primera.body).toEqual({
      serie_id: 2,
      numero: 1,
      record_personal: true,
    });
    const segunda = await registrar({
      ...entrada,
      repeticiones: 7,
      rir: 1,
    }).expect(201);
    expect(segunda.body).toEqual({
      serie_id: 3,
      numero: 2,
      record_personal: false,
    });
    const correccion = await corregir(primera.body.serie_id, {
      peso: 65,
      repeticiones: 8,
      rir: 2,
    }).expect(200);
    expect(correccion.body).toEqual({ serie_id: 2, record_personal: true });
    expect(emitir.mock.calls.map(([nombre]) => nombre)).toEqual([
      'serie.registrada',
      'record-personal.superado',
      'serie.registrada',
      'serie.corregida',
      'record-personal.superado',
    ]);
    expect(records()).toHaveLength(2);
    expect(records()[0]).toBeInstanceOf(RecordPersonalSuperado);
    expect(records()[0]).toMatchObject({
      deportistaId: JUAN,
      ejercicioId: 1,
      serieId: 2,
      peso: 62.5,
      repeticiones: 8,
      fecha: HOY,
    });
    expect(records()[1]).toMatchObject({
      deportistaId: JUAN,
      ejercicioId: 1,
      serieId: 2,
      peso: 65,
      repeticiones: 8,
      fecha: HOY,
    });
    // Cada publicación ocurre después del guardado correspondiente.
    expect(guardar.mock.invocationCallOrder[0]).toBeLessThan(
      emitir.mock.invocationCallOrder[0],
    );
    expect(guardar.mock.invocationCallOrder[2]).toBeLessThan(
      emitir.mock.invocationCallOrder[3],
    );
    const guardada = await sesiones.buscarDelDia(JUAN, 1, HOY);
    expect(guardada?.series).toHaveLength(2);
    expect(guardada?.series[0].peso.valor).toBe(65);
  });

  it.each([
    [65, 1, true],
    [60, 9, true],
    [60, 8, false],
    [60, 7, false],
    [59, 20, false],
  ])(
    'POST: %s kg × %s frente a 60 × 8 informa récord %s',
    async (peso, repeticiones, esperado) => {
      await guardarMarca(60);
      const respuesta = await registrar({
        ...entrada,
        peso: peso as number,
        repeticiones: repeticiones as number,
      }).expect(201);
      expect(respuesta.body.record_personal).toBe(esperado);
      expect(records()).toHaveLength(esperado ? 1 : 0);
    },
  );

  it.each([
    [65, 8, true],
    [60, 9, true],
    [60, 8, false],
    [59, 20, false],
  ])(
    'PATCH: reevalúa %s kg × %s frente al historial e informa récord %s',
    async (peso, repeticiones, esperado) => {
      await guardarMarca(60);
      const creada = await registrar({ ...entrada, peso: 55 }).expect(201);
      const respuesta = await corregir(creada.body.serie_id, {
        peso: peso as number,
        repeticiones: repeticiones as number,
        rir: 2,
      }).expect(200);
      expect(respuesta.body.record_personal).toBe(esperado);
      expect(records()).toHaveLength(esperado ? 1 : 0);
    },
  );

  it('la primera serie de un ejercicio no avisa un récord, tampoco al corregirla sin otras marcas', async () => {
    const primera = await registrar().expect(201);
    expect(primera.body.record_personal).toBe(false);
    const respuesta = await corregir(primera.body.serie_id, {
      peso: 65,
      repeticiones: 8,
      rir: 2,
    }).expect(200);
    expect(respuesta.body.record_personal).toBe(false);
    expect(records()).toHaveLength(0);
  });

  it('compara exclusivamente el ejercicio y el deportista del token', async () => {
    await guardarMarca(60);
    await guardarMarca(150, 8, SOFIA);
    await guardarMarca(200, 8, JUAN, 2, 2);
    const respuesta = await registrar().expect(201);
    expect(respuesta.body.record_personal).toBe(true);
    expect(records()[0].deportistaId).toBe(JUAN);
  });

  it('una corrección que deja de superar el récord devuelve false y no emite otro aviso', async () => {
    await guardarMarca(60);
    const creada = await registrar().expect(201);
    emitir.mockClear();
    const respuesta = await corregir(creada.body.serie_id, {
      peso: 57.5,
      repeticiones: 8,
      rir: 2,
    }).expect(200);
    expect(respuesta.body.record_personal).toBe(false);
    expect(records()).toHaveLength(0);
  });

  it('solo el dueño puede recibir el aviso al registrar o corregir; el entrenador obtiene 403', async () => {
    const creada = await registrar().expect(201);
    emitir.mockClear();
    await registrar(entrada, tokenEntrenador).expect(403);
    await corregir(
      creada.body.serie_id,
      { peso: 65, repeticiones: 8, rir: 2 },
      tokenEntrenador,
    ).expect(403);
    await corregir(
      creada.body.serie_id,
      { peso: 65, repeticiones: 8, rir: 2 },
      tokenSofia,
    ).expect(403);
    expect(records()).toHaveLength(0);
  });

  it('no publica un récord cuando el registro se rechaza o el guardado falla', async () => {
    await guardarMarca(60);
    const invalida = await registrar({ ...entrada, repeticiones: 0 }).expect(
      422,
    );
    expect(invalida.body).toEqual({
      error: 'Las repeticiones tienen que ser mayores a 0.',
    });
    jest
      .spyOn(sesiones, 'guardar')
      .mockRejectedValueOnce(new Error('Guardado fallido'));
    await registrar().expect(500);
    expect(emitir).not.toHaveBeenCalled();
  });

  it('exige autenticación en los dos comandos', async () => {
    await request(app.getHttpServer())
      .post('/api/series')
      .send(entrada)
      .expect(401);
    await request(app.getHttpServer())
      .patch('/api/series/1')
      .send({ peso: 65, repeticiones: 8, rir: 2 })
      .expect(401);
    expect(records()).toHaveLength(0);
  });
});
