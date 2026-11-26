import { Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import {
  Ejercicio,
  GrupoMuscular,
} from '../src/modules/catalogo/domain/entities/ejercicio.entity';
import { IEjercicioRepositoryToken } from '../src/modules/catalogo/domain/interfaces/ejercicio.repository-interface';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { RolNombre } from '../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { PlanEntrenamientoFactory } from '../src/modules/planificacion/domain/factories/plan-entrenamiento.factory';
import { IPlanRepositoryToken } from '../src/modules/planificacion/domain/interfaces/plan.repository-interface';
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
import { EjercicioRepositoryEnMemoria } from './repositorios-en-memoria/ejercicio.repository-en-memoria';
import { PlanRepositoryEnMemoria } from './repositorios-en-memoria/plan.repository-en-memoria';

// US-20: GET /api/sesiones?desde&hasta contra MySQL real para las sesiones y series.
// El plan (planificación) y los nombres de los ejercicios (catálogo) vienen por sus interfaces,
// con los repositorios en memoria. Usa ids de deportista propios del test y borra sus sesiones.

const HOY = '2026-10-21';
const base = 700000 + (Date.now() % 9000) * 10;
const JUAN_ID = base + 1;
const SOFIA_ID = base + 2;
const LAURA_ID = base + 3;
const PLAN_ID = 1;
const PIERNAS = 1;
const TORSO = 2;
const SENTADILLA = 1;
const PESO_MUERTO = 2;
const PRESS_BANCA = 4;

type DatosSerie = [
  ejercicioId: number,
  peso: number,
  repeticiones: number,
  rir: number,
];

const dosificacion = (ejercicioId: number, orden: number) => ({
  ejercicioId,
  orden,
  seriesObjetivo: 3,
  repsMin: 8,
  repsMax: 10,
  rirObjetivo: 2,
});

describe('GET /api/sesiones (US-20)', () => {
  let app: INestApplication;
  let sesiones: ISesionEntrenamientoRepository;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenLaura: string;

  beforeAll(async () => {
    // Plan Fuerza: Piernas (Sentadilla y Peso muerto) y Torso (Press de banca), 3 series cada uno
    const plan = PlanEntrenamientoFactory.crear(LAURA_ID, {
      nombre: 'Fuerza',
      rutinas: [
        {
          nombre: 'Piernas',
          dosificaciones: [
            dosificacion(SENTADILLA, 1),
            dosificacion(PESO_MUERTO, 2),
          ],
        },
        { nombre: 'Torso', dosificaciones: [dosificacion(PRESS_BANCA, 1)] },
      ],
    });
    plan.id = PLAN_ID;
    plan.rutinas[0].id = PIERNAS;
    plan.rutinas[1].id = TORSO;
    const planes = new PlanRepositoryEnMemoria();
    planes.planes.push(plan);

    const ejercicio = (id: number, nombre: string) =>
      Object.assign(new Ejercicio(), {
        id,
        nombre,
        grupoMuscular: GrupoMuscular.PIERNA,
      });

    @Module({
      providers: [
        { provide: IPlanRepositoryToken, useValue: planes },
        {
          provide: IPublicadorEventosRegistroToken,
          useValue: { emit: () => true },
        },
        {
          provide: IEjercicioRepositoryToken,
          useValue: new EjercicioRepositoryEnMemoria([
            ejercicio(SENTADILLA, 'Sentadilla'),
            ejercicio(PESO_MUERTO, 'Peso muerto'),
            ejercicio(PRESS_BANCA, 'Press de banca'),
          ]),
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

  // Guarda una sesión con el repositorio real, pasando por la raíz del agregado
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

  function consultarSesiones(token: string, filtros = {}) {
    return request(app.getHttpServer())
      .get('/api/sesiones')
      .query(filtros)
      .set('Authorization', `Bearer ${token}`);
  }

  it('devuelve las sesiones de la más reciente a la más antigua, con las series agrupadas por ejercicio, el cumplimiento y los récords', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-07', [
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 62.5, 7, 1],
      [PESO_MUERTO, 80, 5, 2],
    ]);
    await guardarSesion(JUAN_ID, TORSO, '2026-10-14', [
      [PRESS_BANCA, 50, 10, 2],
    ]);

    const respuesta = await consultarSesiones(tokenJuan).expect(200);

    expect(respuesta.body).toEqual([
      {
        fecha: '2026-10-14',
        rutina: 'Torso',
        cumplimiento: 33,
        ejercicios: [
          {
            nombre: 'Press de banca',
            cumplimiento: 33,
            // Primera vez que hace el ejercicio: no hay marca anterior, no es récord
            series: [
              {
                numero: 1,
                peso: 50,
                repeticiones: 10,
                rir: 2,
                record_personal: false,
              },
            ],
          },
        ],
      },
      {
        fecha: '2026-10-07',
        rutina: 'Piernas',
        // 3 de 6 series objetivo
        cumplimiento: 50,
        ejercicios: [
          {
            nombre: 'Sentadilla',
            cumplimiento: 67,
            series: [
              {
                numero: 1,
                peso: 60,
                repeticiones: 8,
                rir: 2,
                record_personal: false,
              },
              // Supera los 60 kg de la serie 1 (RN9)
              {
                numero: 2,
                peso: 62.5,
                repeticiones: 7,
                rir: 1,
                record_personal: true,
              },
            ],
          },
          {
            nombre: 'Peso muerto',
            cumplimiento: 33,
            series: [
              {
                numero: 1,
                peso: 80,
                repeticiones: 5,
                rir: 2,
                record_personal: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('filtra por rango de fechas, con los extremos incluidos', async () => {
    for (const fecha of ['2026-10-01', '2026-10-07', '2026-10-14', HOY]) {
      await guardarSesion(JUAN_ID, PIERNAS, fecha, [[SENTADILLA, 60, 8, 2]]);
    }

    const respuesta = await consultarSesiones(tokenJuan, {
      desde: '2026-10-07',
      hasta: '2026-10-14',
    }).expect(200);

    expect(respuesta.body.map((s: { fecha: string }) => s.fecha)).toEqual([
      '2026-10-14',
      '2026-10-07',
    ]);
  });

  it('el deportista solo ve sus propias sesiones (RN17)', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);

    await consultarSesiones(tokenSofia).expect(200, []);
  });

  it('422 si la fecha del filtro no es válida', async () => {
    const respuesta = await consultarSesiones(tokenJuan, {
      desde: 'ayer',
    }).expect(422);

    expect(respuesta.body.error).toContain('Desde debe ser una fecha válida.');
  });

  it('E13: 401 sin token', async () => {
    await request(app.getHttpServer()).get('/api/sesiones').expect(401);
  });

  it('403 si lo pide un entrenador', async () => {
    await consultarSesiones(tokenLaura).expect(403);
  });
});
