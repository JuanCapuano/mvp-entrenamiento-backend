import { Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { RolNombre } from '../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { IPlanRepositoryToken } from '../src/modules/planificacion/domain/interfaces/plan.repository-interface';
import { IEjercicioRepositoryToken } from '../src/modules/catalogo/domain/interfaces/ejercicio.repository-interface';
import { EjercicioRepositoryEnMemoria } from './repositorios-en-memoria/ejercicio.repository-en-memoria';
import { IPublicadorEventosRegistroToken } from '../src/modules/registro/application/publicador-eventos-registro.interface';
import { FECHA_ACTUAL_REGISTRO } from '../src/modules/registro/application/use-cases/registrar-serie.use-case';
import { Serie } from '../src/modules/registro/domain/entities/serie.entity';
import { SesionEntrenamiento } from '../src/modules/registro/domain/entities/sesion-entrenamiento.entity';
import { SesionEntrenamientoFactory } from '../src/modules/registro/domain/factories/sesion-entrenamiento.factory';
import { ISesionEntrenamientoRepositoryToken } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import type { ISesionEntrenamientoRepository } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import { Peso } from '../src/modules/registro/domain/value-objects/peso.vo';
import { Repeticiones } from '../src/modules/registro/domain/value-objects/repeticiones.vo';
import { RIR } from '../src/modules/registro/domain/value-objects/rir.vo';
import { RegistroModule } from '../src/modules/registro/registro.module';
import { PlanRepositoryEnMemoria } from './repositorios-en-memoria/plan.repository-en-memoria';

// US-17: PATCH /api/series/{id} contra MySQL real (la corrección se guarda en cascada con la sesión).
// Usa ids de deportista propios del test y borra sus sesiones antes de cada caso y al terminar.

// Datos del Paso 10: hoy es 21/10; Juan hizo Sentadilla 60 × 8 el 14/10
const HOY = '2026-10-21';
const base = 700000 + (Date.now() % 9000) * 10;
const JUAN_ID = base + 1;
const SOFIA_ID = base + 2;
const LAURA_ID = base + 3;
const PLAN_ID = 1;
const PIERNAS = 1;
const SENTADILLA = 1;

type DatosSerie = [peso: number, repeticiones: number, rir: number];

describe('PATCH /api/series/:id (US-17)', () => {
  let app: INestApplication;
  let sesiones: ISesionEntrenamientoRepository;
  let eventos: { emit: jest.Mock };
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenLaura: string;

  beforeAll(async () => {
    eventos = { emit: jest.fn(() => true) };

    // Corregir una serie no consulta planificación; registro igual exige sus dependencias
    @Module({
      providers: [
        {
          provide: IPlanRepositoryToken,
          useValue: new PlanRepositoryEnMemoria(),
        },
        { provide: IPublicadorEventosRegistroToken, useValue: eventos },
        // US-20: SesionesQueryService pide el nombre de los ejercicios al catálogo
        {
          provide: IEjercicioRepositoryToken,
          useValue: new EjercicioRepositoryEnMemoria(),
        },
      ],
      exports: [
        IPlanRepositoryToken,
        IPublicadorEventosRegistroToken,
        IEjercicioRepositoryToken,
      ],
    })
    class DependenciasDePruebaModule {}

    const modulo = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        // Misma conexión que app.module.ts, solo con las tablas de registro
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'mysql' as const,
            host: config.get<string>('DB_HOST'),
            port: parseInt(config.get<string>('DB_PORT') ?? '3306', 10),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_DATABASE'),
            timezone: '-03:00',
            entities: [SesionEntrenamiento, Serie],
            synchronize: true,
            ssl: config.get<string>('DB_SSL') === 'true',
          }),
        }),
        RegistroModule.conDependencias([DependenciasDePruebaModule]),
      ],
      providers: [JwtService, { provide: APP_GUARD, useClass: AuthGuard }],
    })
      .overrideProvider(FECHA_ACTUAL_REGISTRO)
      .useValue(() => HOY)
      .compile();

    app = modulo.createNestApplication();
    // Misma configuración que main.ts
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

    sesiones = modulo.get(ISesionEntrenamientoRepositoryToken);

    const jwt = modulo.get(JwtService);
    const secret = modulo.get(ConfigService).getOrThrow<string>('JWT_SECRET');
    const firmar = (sub: number, rol: RolNombre) =>
      jwt.signAsync({ sub, rol }, { secret });
    tokenJuan = await firmar(JUAN_ID, RolNombre.DEPORTISTA);
    tokenSofia = await firmar(SOFIA_ID, RolNombre.DEPORTISTA);
    tokenLaura = await firmar(LAURA_ID, RolNombre.ENTRENADOR);
  }, 30000);

  // La limpieza va directo a la tabla (las series se borran en cascada):
  // la interfaz del repositorio no tiene "borrar"
  async function borrarSesiones() {
    await app
      .get(DataSource)
      .getRepository(SesionEntrenamiento)
      .delete({ deportistaId: In([JUAN_ID, SOFIA_ID]) });
  }

  beforeEach(async () => {
    await borrarSesiones();
    eventos.emit.mockClear();
  });

  afterAll(async () => {
    await borrarSesiones();
    await app.close();
  });

  // Guarda una sesión de Sentadilla con el repositorio real y devuelve los ids de sus series, en orden
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
      PLAN_ID,
      PIERNAS,
      fecha,
      SENTADILLA,
      ...vo(primera),
    );
    for (const serie of resto) {
      sesion.registrarSerie(deportistaId, fecha, SENTADILLA, ...vo(serie));
    }
    const guardada = await sesiones.guardar(sesion);
    return [...guardada.series]
      .sort((a, b) => a.numeroSerie - b.numeroSerie)
      .map((serie) => serie.id);
  }

  // Lee la serie de la base, sin pasar por la sesión que tiene en memoria el test
  async function serieEnBase(serieId: number) {
    const sesion = await sesiones.buscarPorSerie(serieId);
    return sesion?.series.find((serie) => serie.id === serieId);
  }

  function corregir(token: string, serieId: number | string, cuerpo: object) {
    return request(app.getHttpServer())
      .patch(`/api/series/${serieId}`)
      .auth(token, { type: 'bearer' })
      .send(cuerpo);
  }

  const CORRECCION = { peso: 65, repeticiones: 8, rir: 2 };

  it('E6: 200, la serie de hoy queda en 65 kg × 8 y supera el récord personal', async () => {
    await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    const respuesta = await corregir(tokenJuan, serieId, CORRECCION).expect(
      200,
    );

    expect(respuesta.body).toEqual({
      serie_id: serieId,
      record_personal: true,
    });
    const guardada = await serieEnBase(serieId);
    expect(guardada?.peso.valor).toBe(65);
    expect(guardada?.repeticiones.valor).toBe(8);
    expect(guardada?.rir.valor).toBe(2);
    expect(eventos.emit.mock.calls.map(([nombre]) => nombre)).toEqual([
      'serie.corregida',
      'record-personal.superado',
    ]);
  });

  it('la serie corregida conserva su número y las demás no cambian', async () => {
    const [primera, segunda, tercera] = await guardarSesion(JUAN_ID, HOY, [
      [62.5, 8, 2],
      [62.5, 7, 1],
      [62.5, 6, 0],
    ]);

    await corregir(tokenJuan, segunda, {
      peso: 60,
      repeticiones: 9,
      rir: 1,
    }).expect(200);

    const corregida = await serieEnBase(segunda);
    expect(corregida?.numeroSerie).toBe(2);
    expect(corregida?.ejercicioId).toBe(SENTADILLA);
    expect(corregida?.peso.valor).toBe(60);
    expect(corregida?.repeticiones.valor).toBe(9);
    expect((await serieEnBase(primera))?.repeticiones.valor).toBe(8);
    expect((await serieEnBase(tercera))?.repeticiones.valor).toBe(6);
    expect((await sesiones.buscarPorSerie(segunda))?.series).toHaveLength(3);
  });

  it('E7: 422 si la serie es de otro día, y no cambia nada', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);

    const respuesta = await corregir(tokenJuan, serieId, CORRECCION).expect(
      422,
    );

    expect(respuesta.body).toEqual({
      error: 'Solo se puede corregir el mismo día.',
    });
    expect((await serieEnBase(serieId))?.peso.valor).toBe(60);
    expect(eventos.emit).not.toHaveBeenCalled();
  });

  it('403 si la serie es de otro deportista, y no cambia nada', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    const respuesta = await corregir(tokenSofia, serieId, CORRECCION).expect(
      403,
    );

    expect(respuesta.body).toEqual({ error: 'La serie no es tuya.' });
    expect((await serieEnBase(serieId))?.peso.valor).toBe(62.5);
  });

  it.each([
    [{ repeticiones: 0 }, 'Las repeticiones tienen que ser mayores a 0.'],
    [{ peso: -5 }, 'El peso no puede ser negativo.'],
    [{ rir: -1 }, 'El RIR no puede ser negativo.'],
  ])(
    '422 con el motivo y sin cambios si los valores no cumplen las condiciones: %j',
    async (cambios, mensaje) => {
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      const respuesta = await corregir(tokenJuan, serieId, {
        ...CORRECCION,
        ...cambios,
      }).expect(422);

      expect(respuesta.body).toEqual({ error: mensaje });
      expect((await serieEnBase(serieId))?.peso.valor).toBe(62.5);
    },
  );

  it.each([
    { fecha: '2026-10-20' },
    { numero: 5 },
    { ejercicio_id: 2 },
    { repeticiones: 1.5 },
    { peso: '65' },
    { peso: 0.001 },
  ])(
    '422 si el cliente manda fecha, número, ejercicio o un formato inválido: %j',
    async (cambios) => {
      const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

      await corregir(tokenJuan, serieId, { ...CORRECCION, ...cambios }).expect(
        422,
      );

      expect((await serieEnBase(serieId))?.peso.valor).toBe(62.5);
    },
  );

  it('200 sin récord si el valor corregido no supera la mejor marca', async () => {
    await guardarSesion(JUAN_ID, '2026-10-14', [[60, 8, 2]]);
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    const respuesta = await corregir(tokenJuan, serieId, {
      peso: 57.5,
      repeticiones: 8,
      rir: 2,
    }).expect(200);

    expect(respuesta.body).toEqual({
      serie_id: serieId,
      record_personal: false,
    });
    expect(eventos.emit.mock.calls.map(([nombre]) => nombre)).toEqual([
      'serie.corregida',
    ]);
  });

  it('404 si la serie no existe', async () => {
    const respuesta = await corregir(tokenJuan, 2147483000, CORRECCION).expect(
      404,
    );

    expect(respuesta.body).toEqual({ error: 'La serie no existe.' });
  });

  it('422 si el id de la serie no es un número', async () => {
    await corregir(tokenJuan, 'primera', CORRECCION).expect(422);
  });

  it('E13: 401 sin token', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    await request(app.getHttpServer())
      .patch(`/api/series/${serieId}`)
      .send(CORRECCION)
      .expect(401);
  });

  it('RN1: 403 si lo pide un entrenador', async () => {
    const [serieId] = await guardarSesion(JUAN_ID, HOY, [[62.5, 8, 2]]);

    await corregir(tokenLaura, serieId, CORRECCION).expect(403);
    expect((await serieEnBase(serieId))?.peso.valor).toBe(62.5);
  });
});
