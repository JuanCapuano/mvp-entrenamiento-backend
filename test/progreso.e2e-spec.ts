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
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { RolNombre } from '../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
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
import { PlanRepositoryEnMemoria } from './repositorios-en-memoria/plan.repository-en-memoria';
import { IEjercicioRepositoryToken } from '../src/modules/catalogo/domain/interfaces/ejercicio.repository-interface';
import { EjercicioRepositoryEnMemoria } from './repositorios-en-memoria/ejercicio.repository-en-memoria';

// US-19: GET /api/progreso y GET /api/progreso/ejercicios contra MySQL real.
// El progreso no depende del plan vigente: planificación se reemplaza por su repositorio en memoria.
// Usa ids de deportista y ejercicios propios del test, y los borra antes de cada caso y al terminar.

// Datos del Paso 10: hoy es 21/10; el 14/10 Juan hizo Piernas con Sentadilla 60 × 8 (×3)
const HOY = '2026-10-21';
const base = 900000 + (Date.now() % 9000) * 10;
const JUAN_ID = base + 1;
const SOFIA_ID = base + 2;
const LAURA_ID = base + 3;
const PLAN_ID = 1;
const PIERNAS = 1;
const TORSO = 2;
const sufijo = ` (e2e ${base})`;

type DatosSerie = [
  ejercicioId: number,
  peso: number,
  repeticiones: number,
  rir: number,
];

describe('Progreso del deportista (US-19)', () => {
  let app: INestApplication;
  let sesiones: ISesionEntrenamientoRepository;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenLaura: string;
  let SENTADILLA: number;
  let PRESS_BANCA: number;

  beforeAll(async () => {
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
        // Misma conexión que app.module.ts: las tablas de registro y la del catálogo (para el nombre)
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
            entities: [SesionEntrenamiento, Serie, Ejercicio],
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

    // Ejercicios propios del test (el nombre es único en el catálogo)
    const ejercicios = app.get(DataSource).getRepository(Ejercicio);
    const [sentadilla, press] = await ejercicios.save([
      ejercicios.create({
        nombre: `Sentadilla con barra${sufijo}`,
        grupoMuscular: GrupoMuscular.PIERNA,
        subgrupo: null,
      }),
      ejercicios.create({
        nombre: `Press banca plano${sufijo}`,
        grupoMuscular: GrupoMuscular.PECHO,
        subgrupo: null,
      }),
    ]);
    SENTADILLA = sentadilla.id;
    PRESS_BANCA = press.id;

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
    await app
      .get(DataSource)
      .getRepository(Ejercicio)
      .delete({ id: In([SENTADILLA, PRESS_BANCA]) });
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

  function progreso(token: string | null, ejercicioId?: number | string) {
    const peticion = request(app.getHttpServer())
      .get('/api/progreso')
      .query(ejercicioId === undefined ? {} : { ejercicio_id: ejercicioId });
    return token ? peticion.auth(token, { type: 'bearer' }) : peticion;
  }

  function ejerciciosConProgreso(token: string) {
    return request(app.getHttpServer())
      .get('/api/progreso/ejercicios')
      .auth(token, { type: 'bearer' });
  }

  describe('GET /api/progreso', () => {
    it('E8: Sentadilla 60 × 8 (14/10) y 65 × 8 (21/10) → récord 65 × 8 y 1RM estimado 82,3', async () => {
      await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
        [SENTADILLA, 60, 8, 2],
        [SENTADILLA, 60, 8, 2],
        [SENTADILLA, 60, 8, 2],
      ]);
      await guardarSesion(JUAN_ID, PIERNAS, HOY, [[SENTADILLA, 65, 8, 1]]);

      const respuesta = await progreso(tokenJuan, SENTADILLA).expect(200);

      expect(respuesta.body).toEqual({
        record: { peso: 65, repeticiones: 8, fecha: HOY },
        por_fecha: [
          {
            fecha: '2026-10-14',
            peso_maximo: 60,
            rm_estimado: 76,
            mejor_serie: { peso: 60, repeticiones: 8 },
            volumen: 1440,
          },
          {
            fecha: HOY,
            peso_maximo: 65,
            rm_estimado: 82.3,
            mejor_serie: { peso: 65, repeticiones: 8 },
            volumen: 520,
          },
        ],
      });
    });

    it('incluye todas las sesiones del ejercicio, aunque sean de rutinas distintas el mismo día', async () => {
      await guardarSesion(JUAN_ID, PIERNAS, HOY, [[SENTADILLA, 60, 8, 2]]);
      await guardarSesion(JUAN_ID, TORSO, HOY, [[SENTADILLA, 62.5, 6, 2]]);

      const respuesta = await progreso(tokenJuan, SENTADILLA).expect(200);

      expect(respuesta.body.por_fecha).toEqual([
        {
          fecha: HOY,
          peso_maximo: 62.5,
          // 60 × 8 → 76 supera a 62,5 × 6 → 75: el 1RM del día es el mayor, no el de la serie más pesada
          rm_estimado: 76,
          mejor_serie: { peso: 62.5, repeticiones: 6 },
          volumen: 855,
        },
      ]);
    });

    it('si nunca hizo el ejercicio: record null y por_fecha vacío', async () => {
      const respuesta = await progreso(tokenJuan, PRESS_BANCA).expect(200);

      expect(respuesta.body).toEqual({ record: null, por_fecha: [] });
    });

    it('RN17: el deportista solo ve sus propias series', async () => {
      await guardarSesion(SOFIA_ID, PIERNAS, HOY, [[SENTADILLA, 100, 5, 0]]);

      const respuesta = await progreso(tokenJuan, SENTADILLA).expect(200);

      expect(respuesta.body).toEqual({ record: null, por_fecha: [] });
    });

    it('sin ejercicio_id responde 422', async () => {
      const respuesta = await progreso(tokenJuan).expect(422);

      expect(respuesta.body.error).toBeDefined();
    });

    it('con un ejercicio_id que no es un entero positivo responde 422', async () => {
      await progreso(tokenJuan, 'abc').expect(422);
      await progreso(tokenJuan, 0).expect(422);
    });

    it('E13: sin token responde 401', async () => {
      await progreso(null, SENTADILLA).expect(401);
    });

    it('un entrenador no puede consultar este endpoint: 403', async () => {
      await progreso(tokenLaura, SENTADILLA).expect(403);
    });
  });

  describe('GET /api/progreso/ejercicios (CU23)', () => {
    it('solo aparecen los ejercicios que el deportista registró alguna vez, con su nombre y sin repetir', async () => {
      await guardarSesion(JUAN_ID, PIERNAS, '2026-10-14', [
        [SENTADILLA, 60, 8, 2],
        [SENTADILLA, 60, 8, 2],
      ]);
      await guardarSesion(JUAN_ID, PIERNAS, HOY, [[SENTADILLA, 65, 8, 1]]);

      const respuesta = await ejerciciosConProgreso(tokenJuan).expect(200);

      expect(respuesta.body).toEqual([
        { id: SENTADILLA, nombre: `Sentadilla con barra${sufijo}` },
      ]);
    });

    it('sin series registradas devuelve una lista vacía', async () => {
      const respuesta = await ejerciciosConProgreso(tokenSofia).expect(200);

      expect(respuesta.body).toEqual([]);
    });

    it('un entrenador no puede consultar este endpoint: 403', async () => {
      await ejerciciosConProgreso(tokenLaura).expect(403);
    });
  });
});
