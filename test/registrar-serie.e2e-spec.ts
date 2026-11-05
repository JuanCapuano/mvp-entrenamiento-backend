import { Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { RolNombre } from '../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { RegistroModule } from '../src/modules/registro/registro.module';
import { SesionEntrenamiento } from '../src/modules/registro/domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../src/modules/registro/domain/entities/serie.entity';
import { ISesionEntrenamientoRepositoryToken } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import { IPlanRepositoryToken } from '../src/modules/planificacion/domain/interfaces/plan.repository-interface';
import { IPublicadorEventosRegistroToken } from '../src/modules/registro/application/publicador-eventos-registro.interface';
import { FECHA_ACTUAL_REGISTRO } from '../src/modules/registro/application/use-cases/registrar-serie.use-case';
import { SesionEntrenamientoFactory } from '../src/modules/registro/domain/factories/sesion-entrenamiento.factory';
import { Peso } from '../src/modules/registro/domain/value-objects/peso.vo';
import { Repeticiones } from '../src/modules/registro/domain/value-objects/repeticiones.vo';
import { RIR } from '../src/modules/registro/domain/value-objects/rir.vo';
import { PlanRepositoryEnMemoria } from './repositorios-en-memoria/plan.repository-en-memoria';
import { SesionEntrenamientoRepositoryEnMemoria } from './repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';

describe('POST /api/series (US-15)', () => {
  let app: INestApplication;
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let planes: PlanRepositoryEnMemoria;
  let deportista: string;
  let entrenador: string;
  const hoy = '2026-10-21';
  const entrada = {
    rutina_id: 1,
    ejercicio_id: 1,
    peso: 62.5,
    repeticiones: 8,
    rir: 2,
  };

  beforeEach(async () => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    planes = new PlanRepositoryEnMemoria();
    planes.asignaciones.push({
      deportistaId: 3,
      desde: '2026-10-01',
      hasta: '2026-11-30',
      plan: {
        id: 1,
        contieneEjercicio: (rutina, ejercicio) =>
          rutina === 1 && ejercicio === 1,
      },
    });
    @Module({
      providers: [
        { provide: IPlanRepositoryToken, useValue: planes },
        {
          provide: IPublicadorEventosRegistroToken,
          useValue: { emit: () => true },
        },
      ],
      exports: [IPlanRepositoryToken, IPublicadorEventosRegistroToken],
    })
    class DependenciasDePruebaModule {}

    const modulo = await Test.createTestingModule({
      imports: [RegistroModule.conDependencias([DependenciasDePruebaModule])],
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: new ConfigService({
            JWT_SECRET: 'secreto-exclusivo-de-pruebas-us15',
          }),
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
      .overrideProvider(ISesionEntrenamientoRepositoryToken)
      .useValue(sesiones)
      .overrideProvider(getRepositoryToken(SesionEntrenamiento))
      .useValue({})
      .overrideProvider(getRepositoryToken(Serie))
      .useValue({})
      .overrideProvider(FECHA_ACTUAL_REGISTRO)
      .useValue(() => hoy)
      .compile();
    const jwt = modulo.get(JwtService);
    deportista = await jwt.signAsync(
      { sub: 3, rol: RolNombre.DEPORTISTA },
      { secret: 'secreto-exclusivo-de-pruebas-us15' },
    );
    entrenador = await jwt.signAsync(
      { sub: 1, rol: RolNombre.ENTRENADOR },
      { secret: 'secreto-exclusivo-de-pruebas-us15' },
    );
    app = modulo.createNestApplication();
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

  it('E2/E3: 201 con el contrato exacto y la misma sesión para series sucesivas', async () => {
    await sesiones.guardar(
      new SesionEntrenamientoFactory().crear(
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
    const primera = await request(app.getHttpServer())
      .post('/api/series')
      .auth(deportista, { type: 'bearer' })
      .send(entrada)
      .expect(201);
    expect(primera.body).toEqual({
      serie_id: 2,
      numero: 1,
      record_personal: true,
    });
    const segunda = await request(app.getHttpServer())
      .post('/api/series')
      .auth(deportista, { type: 'bearer' })
      .send({ ...entrada, repeticiones: 7, rir: 1 })
      .expect(201);
    expect(segunda.body).toEqual({
      serie_id: 3,
      numero: 2,
      record_personal: false,
    });
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.series).toHaveLength(2);
  });

  it.each([
    [{ repeticiones: 0 }, 'Las repeticiones tienen que ser mayores a 0.'],
    [{ peso: -5 }, 'El peso no puede ser negativo.'],
    [{ rir: -1 }, 'El RIR no puede ser negativo.'],
    [
      { ejercicio_id: 2 },
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    ],
  ])(
    'E4/E5 y RN3/RN6: 422 con motivo y sin registro para %j',
    async (cambios, mensaje) => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/series')
        .auth(deportista, { type: 'bearer' })
        .send({ ...entrada, ...cambios })
        .expect(422);
      expect(respuesta.body).toEqual({ error: mensaje });
      expect(await sesiones.buscarDelDia(3, 1, hoy)).toBeNull();
    },
  );

  it.each([
    { fecha: '2026-10-20' },
    { deportista_id: 4 },
    { numero: 50 },
    { repeticiones: 1.5 },
    { rir: 0.5 },
    { peso: 0.001 },
    { peso: '60' },
    { peso: null },
  ])(
    'rechaza fechas, identidad, numeración o formato impuestos por el cliente: %j',
    async (cambios) => {
      await request(app.getHttpServer())
        .post('/api/series')
        .auth(deportista, { type: 'bearer' })
        .send({ ...entrada, ...cambios })
        .expect(422);
      expect(await sesiones.buscarDelDia(3, 1, hoy)).toBeNull();
    },
  );

  it('acepta peso corporal, RIR cero y fecha exclusivamente del servidor', async () => {
    await request(app.getHttpServer())
      .post('/api/series')
      .auth(deportista, { type: 'bearer' })
      .send({ ...entrada, peso: 0, rir: 0 })
      .expect(201);
    expect((await sesiones.buscarDelDia(3, 1, hoy))?.fecha).toBe(hoy);
  });
  it('rechaza al deportista sin plan vigente', async () => {
    planes.asignaciones.length = 0;
    const respuesta = await request(app.getHttpServer())
      .post('/api/series')
      .auth(deportista, { type: 'bearer' })
      .send(entrada)
      .expect(422);
    expect(respuesta.body).toEqual({ error: 'No tenés un plan vigente.' });
  });
  it('E13: exige token válido (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/series')
      .send(entrada)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/series')
      .auth('token-invalido', { type: 'bearer' })
      .send(entrada)
      .expect(401);
  });
  it('RN1: el entrenador no puede registrar series (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/series')
      .auth(entrenador, { type: 'bearer' })
      .send(entrada)
      .expect(403);
    expect(await sesiones.buscarDelDia(1, 1, hoy)).toBeNull();
  });
});
