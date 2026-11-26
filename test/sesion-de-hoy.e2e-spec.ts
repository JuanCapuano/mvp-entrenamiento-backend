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

// US-16: GET /api/sesiones/hoy?rutina_id contra MySQL real para las sesiones y series.
// Lo prescripto (series objetivo) viene de planificación, que todavía no está integrada:
// se usa su interfaz con el repositorio en memoria, como indica el CLAUDE.md.
// Usa ids de deportista propios del test y borra sus sesiones antes de cada caso y al terminar.

// Datos del Paso 10: hoy es 21/10; plan Fuerza de Juan vigente del 01/10 al 30/11
const HOY = '2026-10-21';
const base = 800000 + (Date.now() % 9000) * 10;
const JUAN_ID = base + 1;
const SOFIA_ID = base + 2;
const LAURA_ID = base + 3;
const PLAN_ID = 1;
const PIERNAS = 1;
const TORSO = 2;
const RUTINA_AJENA = 99;
const SENTADILLA = 1;
const PESO_MUERTO = 2;
const PRESS_BANCA = 4;

type DatosSerie = [
  ejercicioId: number,
  peso: number,
  repeticiones: number,
  rir: number,
];

describe('GET /api/sesiones/hoy (US-16)', () => {
  let app: INestApplication;
  let sesiones: ISesionEntrenamientoRepository;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenLaura: string;

  beforeAll(async () => {
    // Plan Fuerza de Juan: Piernas y Torso, 3 series objetivo por ejercicio.
    // Las dosificaciones de Piernas van desordenadas a propósito. Sofía no tiene plan.
    const planes = new PlanRepositoryEnMemoria();
    planes.asignaciones.push({
      deportistaId: JUAN_ID,
      desde: '2026-10-01',
      hasta: '2026-11-30',
      plan: { id: PLAN_ID, contieneEjercicio: () => true },
      rutinas: {
        [PIERNAS]: [
          { ejercicioId: PESO_MUERTO, orden: 2, seriesObjetivo: 3 },
          { ejercicioId: SENTADILLA, orden: 1, seriesObjetivo: 3 },
        ],
        [TORSO]: [{ ejercicioId: PRESS_BANCA, orden: 1, seriesObjetivo: 3 }],
      },
    });

    @Module({
      providers: [
        { provide: IPlanRepositoryToken, useValue: planes },
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

  function sesionDeHoy(token: string, rutinaId?: number | string) {
    return request(app.getHttpServer())
      .get('/api/sesiones/hoy')
      .query(rutinaId === undefined ? {} : { rutina_id: rutinaId })
      .auth(token, { type: 'bearer' });
  }

  it('sin series registradas hoy: 0 % y cada ejercicio de la rutina, en orden, sin series', async () => {
    const respuesta = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);

    expect(respuesta.body).toEqual({
      cumplimiento: 0,
      ejercicios: [
        { ejercicio_id: SENTADILLA, series_objetivo: 3, series: [] },
        { ejercicio_id: PESO_MUERTO, series_objetivo: 3, series: [] },
      ],
    });
  });

  it('muestra las series registradas frente a las series objetivo y el cumplimiento de la sesión', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [
      [SENTADILLA, 62.5, 8, 2],
      [SENTADILLA, 62.5, 7, 1],
    ]);

    const respuesta = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);

    // 2 de 6 series objetivo
    const id = expect.any(Number);
    expect(respuesta.body).toEqual({
      cumplimiento: 33,
      ejercicios: [
        {
          ejercicio_id: SENTADILLA,
          series_objetivo: 3,
          series: [
            { id, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 },
            { id, numero: 2, peso: 62.5, repeticiones: 7, rir: 1 },
          ],
        },
        { ejercicio_id: PESO_MUERTO, series_objetivo: 3, series: [] },
      ],
    });
  });

  it('con todas las series objetivo, el cumplimiento es 100 %', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [PESO_MUERTO, 50, 10, 2],
      [PESO_MUERTO, 50, 10, 2],
      [PESO_MUERTO, 50, 10, 2],
    ]);

    const respuesta = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);

    expect(respuesta.body.cumplimiento).toBe(100);
  });

  it('el cumplimiento no supera el 100 % y se muestran todas las series, aunque superen las pedidas', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 6, 0],
      [PESO_MUERTO, 50, 10, 2],
      [PESO_MUERTO, 50, 10, 2],
      [PESO_MUERTO, 50, 10, 2],
    ]);

    const respuesta = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);

    expect(respuesta.body.cumplimiento).toBe(100);
    const [sentadilla] = respuesta.body.ejercicios;
    expect(sentadilla.series_objetivo).toBe(3);
    expect(sentadilla.series.map((s: { numero: number }) => s.numero)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('las series de más en un ejercicio no compensan las que faltan en otro', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, HOY, [
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
      [SENTADILLA, 60, 8, 2],
    ]);

    const respuesta = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);

    expect(respuesta.body.cumplimiento).toBe(50);
  });

  it('solo cuenta la sesión de hoy de esa rutina: ni otros días ni otra rutina', async () => {
    await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8, 2],
    ]);
    await guardarSesion(JUAN_ID, TORSO, HOY, [[PRESS_BANCA, 50, 8, 2]]);

    const piernas = await sesionDeHoy(tokenJuan, PIERNAS).expect(200);
    const torso = await sesionDeHoy(tokenJuan, TORSO).expect(200);

    expect(piernas.body.cumplimiento).toBe(0);
    expect(piernas.body.ejercicios[0].series).toEqual([]);
    expect(torso.body.cumplimiento).toBe(33);
    expect(torso.body.ejercicios).toHaveLength(1);
  });

  it('403 si la rutina no es del plan vigente del deportista', async () => {
    const respuesta = await sesionDeHoy(tokenJuan, RUTINA_AJENA).expect(403);

    expect(respuesta.body).toEqual({
      error: 'La rutina no es de tu plan vigente.',
    });
  });

  it('403 si el deportista no tiene plan vigente (RN17)', async () => {
    await sesionDeHoy(tokenSofia, PIERNAS).expect(403);
  });

  it('E13: 401 sin token', async () => {
    await request(app.getHttpServer())
      .get('/api/sesiones/hoy')
      .query({ rutina_id: PIERNAS })
      .expect(401);
  });

  it('403 si lo pide un entrenador', async () => {
    await sesionDeHoy(tokenLaura, PIERNAS).expect(403);
  });

  it.each([undefined, 'piernas', 0, 1.5])(
    '422 si rutina_id es %p',
    async (rutinaId) => {
      await sesionDeHoy(tokenJuan, rutinaId).expect(422);
    },
  );
});
