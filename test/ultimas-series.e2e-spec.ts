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

// US-14: GET /api/ejercicios/{id}/ultimas-series contra MySQL real (la consulta es SQL).
// Usa las tablas sesion_entrenamiento y serie con ids de deportista propios del test,
// y borra sus sesiones antes de cada caso y al terminar.

// Datos del Paso 10: hoy es 21/10; Juan hizo Piernas el 14/10
const HOY = '2026-10-21';
const base = 900000 + (Date.now() % 90000) * 10;
const JUAN_ID = base + 1;
const SOFIA_ID = base + 2;
const LAURA_ID = base + 3;
const PLAN_ID = 1;
const PIERNAS = 1;
const TORSO = 2;
const SENTADILLA = 1;
const PESO_MUERTO = 2;

type DatosSerie = [
  ejercicioId: number,
  peso: number,
  repeticiones: number,
  rir: number,
];

describe('GET /api/ejercicios/:id/ultimas-series (US-14)', () => {
  let app: INestApplication;
  let sesiones: ISesionEntrenamientoRepository;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenLaura: string;

  beforeAll(async () => {
    // Registro exige planificación y eventos, que esta consulta no usa
    @Module({
      providers: [
        {
          provide: IPlanRepositoryToken,
          useValue: new PlanRepositoryEnMemoria(),
        },
        {
          provide: IPublicadorEventosRegistroToken,
          useValue: { emit: () => true },
        },
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

  beforeEach(borrarSesiones);

  afterAll(async () => {
    await borrarSesiones();
    await app.close();
  });

  // Guarda una sesión de otro día con el repositorio real, pasando por la raíz del agregado
  async function guardarSesion(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
    series: DatosSerie[],
  ) {
    const [primera, ...resto] = series;
    const vo = ([, peso, repeticiones, rir]: DatosSerie) =>
      [
        Peso.crear(peso),
        Repeticiones.crear(repeticiones),
        RIR.crear(rir),
      ] as const;

    const sesion = new SesionEntrenamientoFactory().crear(
      deportistaId,
      PLAN_ID,
      rutinaId,
      fecha,
      primera[0],
      ...vo(primera),
    );
    for (const serie of resto) {
      sesion.registrarSerie(deportistaId, fecha, serie[0], ...vo(serie));
    }
    await sesiones.guardar(sesion);
  }

  function ultimasSeries(token: string, ejercicioId: number | string) {
    return request(app.getHttpServer())
      .get(`/api/ejercicios/${ejercicioId}/ultimas-series`)
      .auth(token, { type: 'bearer' });
  }

  it('E1: Juan ve la fecha y las series de la última vez (14/10: 60 × 8, 60 × 8, 60 × 8)', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 1],
    ]);

    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body).toEqual({
      fecha: '2026-10-14',
      series: [
        { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 2, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 3, peso: 60, repeticiones: 8, rir: 1 },
      ],
    });
  });

  it('si nunca hizo el ejercicio: fecha null y series vacías', async () => {
    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body).toEqual({ fecha: null, series: [] });
  });

  it('entre varias sesiones devuelve solo la más reciente', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-07', [
      [SENTADILLA, 57.5, 8, 2],
    ]);
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);
    await guardarSesion(JUAN_ID, PIERNAS, '2026-09-30', [
      [SENTADILLA, 55, 8, 2],
    ]);

    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body).toEqual({
      fecha: '2026-10-14',
      series: [{ numero: 1, peso: 60, repeticiones: 8, rir: 2 }],
    });
  });

  it('las series de hoy no cuentan como la última vez: se muestran aparte', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [[SENTADILLA, 62.5, 8, 2]]);

    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body.fecha).toBe('2026-10-14');
    expect(respuesta.body.series).toEqual([
      { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
    ]);
  });

  it('si solo lo hizo hoy, sigue siendo la primera vez', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [[SENTADILLA, 62.5, 8, 2]]);

    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body).toEqual({ fecha: null, series: [] });
  });

  it('devuelve solo las series de ese ejercicio, no las del resto de la sesión', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
      [PESO_MUERTO, 50, 10, 2],
      [SENTADILLA, 60, 7, 1],
    ]);

    const respuesta = await ultimasSeries(tokenJuan, PESO_MUERTO).expect(200);

    expect(respuesta.body).toEqual({
      fecha: '2026-10-14',
      series: [{ numero: 1, peso: 50, repeticiones: 10, rir: 2 }],
    });
  });

  it('busca la última sesión en la que hizo ese ejercicio, aunque después haya entrenado otra cosa', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-07', [
      [PESO_MUERTO, 50, 10, 2],
    ]);
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);

    const respuesta = await ultimasSeries(tokenJuan, PESO_MUERTO).expect(200);

    expect(respuesta.body.fecha).toBe('2026-10-07');
  });

  it('el mismo ejercicio en otra rutina también cuenta como última vez', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-07', [
      [SENTADILLA, 57.5, 8, 2],
    ]);
    await guardarSesion(JUAN_ID, TORSO, '2026-10-14', [[SENTADILLA, 60, 8, 2]]);

    const respuesta = await ultimasSeries(tokenJuan, SENTADILLA).expect(200);

    expect(respuesta.body.fecha).toBe('2026-10-14');
  });

  it('RN17: el deportista solo ve sus propias series', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);

    const respuesta = await ultimasSeries(tokenSofia, SENTADILLA).expect(200);

    expect(respuesta.body).toEqual({ fecha: null, series: [] });
  });

  it('E13: 401 sin token', async () => {
    await request(app.getHttpServer())
      .get(`/api/ejercicios/${SENTADILLA}/ultimas-series`)
      .expect(401);
  });

  it('403 si lo pide un entrenador', async () => {
    await ultimasSeries(tokenLaura, SENTADILLA).expect(403);
  });

  it('422 si el id del ejercicio no es un número', async () => {
    const respuesta = await ultimasSeries(tokenJuan, 'sentadilla').expect(422);

    expect(respuesta.body).toEqual({
      error: 'El ejercicio debe ser un identificador positivo.',
    });
  });
});
