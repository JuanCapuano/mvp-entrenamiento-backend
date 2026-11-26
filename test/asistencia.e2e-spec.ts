import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanEntrenamiento } from '../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';
import { SesionEntrenamiento } from '../src/modules/registro/domain/entities/sesion-entrenamiento.entity';
import { SesionEntrenamientoFactory } from '../src/modules/registro/domain/factories/sesion-entrenamiento.factory';
import { ISesionEntrenamientoRepositoryToken } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import type { ISesionEntrenamientoRepository } from '../src/modules/registro/domain/interfaces/sesion-entrenamiento.repository-interface';
import { Peso } from '../src/modules/registro/domain/value-objects/peso.vo';
import { Repeticiones } from '../src/modules/registro/domain/value-objects/repeticiones.vo';
import { RIR } from '../src/modules/registro/domain/value-objects/rir.vo';

// US-12: GET /api/deportistas/{id}/asistencia con la app completa contra MySQL real.
// Cruza tres módulos: el vínculo (usuario), el plan con sus rutinas (planificación) y las
// sesiones (registro). Usuarios, vínculo y plan se crean por la API; las sesiones se guardan
// con el repositorio porque son de fechas pasadas, que la API no permite registrar (RN12).
// El test crea sus propios datos con emails únicos y los borra al terminar.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';
const LAURA = {
  nombre: 'Laura Gómez',
  email: `laura.asistencia.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};
const MARTIN = {
  nombre: 'Martín Díaz',
  email: `martin.asistencia.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};
const JUAN = {
  nombre: 'Juan Pérez',
  email: `juan.asistencia.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};
const SOFIA = {
  nombre: 'Sofía Ruiz',
  email: `sofia.asistencia.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};

type DatosSerie = [ejercicioId: number, peso: number, repeticiones: number];

describe('GET /api/deportistas/{id}/asistencia (US-12)', () => {
  let app: INestApplication;
  let tokenLaura: string;
  let tokenMartin: string;
  let tokenJuan: string;
  let lauraId: number;
  let juanId: number;
  let sofiaId: number;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    for (const usuario of [LAURA, MARTIN, JUAN, SOFIA]) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...usuario, contrasena: CONTRASENA })
        .expect(201);
    }
    ({ token: tokenLaura, id: lauraId } = await ingresar(LAURA.email));
    ({ token: tokenMartin } = await ingresar(MARTIN.email));
    ({ token: tokenJuan, id: juanId } = await ingresar(JUAN.email));
    ({ id: sofiaId } = await ingresar(SOFIA.email));

    // Laura vincula a Juan (US-03). Sofía queda sin entrenador.
    await request(app.getHttpServer())
      .post('/api/deportistas')
      .auth(tokenLaura, { type: 'bearer' })
      .send({ email: JUAN.email })
      .expect(201);

    // Plan "Fuerza" del Paso 10, armado por la API (US-06) con ejercicios del catálogo
    const catalogo = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .auth(tokenLaura, { type: 'bearer' })
      .expect(200);
    const [sentadilla, pesoMuerto, pressBanca] = (
      catalogo.body as { id: number }[]
    ).map((e) => e.id);
    const dosificacion = (ejercicioId: number, orden: number) => ({
      ejercicio_id: ejercicioId,
      orden,
      series_objetivo: 3,
      reps_min: 8,
      reps_max: 10,
      rir_objetivo: 2,
    });
    const creado = await request(app.getHttpServer())
      .post('/api/planes')
      .auth(tokenLaura, { type: 'bearer' })
      .send({
        nombre: 'Fuerza',
        rutinas: [
          {
            nombre: 'Piernas',
            dosificaciones: [
              dosificacion(sentadilla, 1),
              dosificacion(pesoMuerto, 2),
            ],
          },
          { nombre: 'Torso', dosificaciones: [dosificacion(pressBanca, 1)] },
        ],
      })
      .expect(201);
    const detalle = await request(app.getHttpServer())
      .get(`/api/planes/${creado.body.id}`)
      .auth(tokenLaura, { type: 'bearer' })
      .expect(200);
    const rutinaId = (nombre: string) =>
      (detalle.body.rutinas as { id: number; nombre: string }[]).find(
        (r) => r.nombre === nombre,
      )!.id;
    const piernas = rutinaId('Piernas');
    const torso = rutinaId('Torso');

    // Sesiones de Juan (en este orden, para que los ids reflejen cuál empezó antes):
    // 14/10 Piernas: 3 de 6 series objetivo → 50 %
    // 16/10 Torso: 4 series de press con 3 pedidas → 100 % (tope)
    // 21/10 Piernas: todo lo pedido → 100 %
    // 21/10 Torso: 1 de 3 → 33 % (segunda rutina del mismo día)
    const guardar = guardarSesion(creado.body.id as number);
    await guardar(juanId, piernas, '2026-10-14', [
      [sentadilla, 60, 8],
      [sentadilla, 60, 8],
      [sentadilla, 60, 8],
    ]);
    await guardar(juanId, torso, '2026-10-16', [
      [pressBanca, 50, 8],
      [pressBanca, 50, 8],
      [pressBanca, 50, 8],
      [pressBanca, 45, 10],
    ]);
    await guardar(juanId, piernas, '2026-10-21', [
      [sentadilla, 62.5, 8],
      [sentadilla, 62.5, 7],
      [sentadilla, 62.5, 7],
      [pesoMuerto, 70, 8],
      [pesoMuerto, 70, 8],
      [pesoMuerto, 70, 8],
    ]);
    await guardar(juanId, torso, '2026-10-21', [[pressBanca, 50, 8]]);
    // Una sesión de Sofía, que no debe aparecer en la asistencia de nadie
    await guardar(sofiaId, piernas, '2026-10-21', [[sentadilla, 40, 10]]);
  }, 60000);

  afterAll(async () => {
    const datos = app.get(DataSource);
    await datos
      .getRepository(SesionEntrenamiento)
      .delete({ deportistaId: In([juanId, sofiaId]) });
    // Las rutinas, dosificaciones y asignaciones se borran en cascada con el plan
    await datos
      .getRepository(PlanEntrenamiento)
      .delete({ entrenadorId: lauraId });
    await datos.getRepository(Usuario).delete({
      email: In([LAURA.email, MARTIN.email, JUAN.email, SOFIA.email]),
    });
    await app.close();
  });

  async function ingresar(
    email: string,
  ): Promise<{ token: string; id: number }> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA })
      .expect(200);
    return {
      token: respuesta.body.access_token,
      id: respuesta.body.usuario.id,
    };
  }

  // Guarda una sesión con el repositorio real, pasando por la raíz del agregado
  function guardarSesion(planId: number) {
    return async (
      deportistaId: number,
      rutinaId: number,
      fecha: string,
      series: DatosSerie[],
    ) => {
      const sesiones = app.get<ISesionEntrenamientoRepository>(
        ISesionEntrenamientoRepositoryToken,
        { strict: false },
      );
      const vo = ([, peso, repeticiones]: DatosSerie) =>
        [
          Peso.crear(peso),
          Repeticiones.crear(repeticiones),
          RIR.crear(2),
        ] as const;
      const [primera, ...resto] = series;
      const sesion = new SesionEntrenamientoFactory().crear(
        deportistaId,
        planId,
        rutinaId,
        fecha,
        primera[0],
        ...vo(primera),
      );
      for (const serie of resto) {
        sesion.registrarSerie(deportistaId, fecha, serie[0], ...vo(serie));
      }
      await sesiones.guardar(sesion);
    };
  }

  function asistencia(
    token: string | null,
    deportistaId: number | string,
    filtros: { desde?: string; hasta?: string } = {},
  ) {
    const peticion = request(app.getHttpServer())
      .get(`/api/deportistas/${deportistaId}/asistencia`)
      .query(filtros);
    return token ? peticion.auth(token, { type: 'bearer' }) : peticion;
  }

  describe('entrenador con su deportista vinculado', () => {
    it('muestra fecha, rutina y cumplimiento de cada sesión, de la más reciente a la más antigua', async () => {
      const respuesta = await asistencia(tokenLaura, juanId).expect(200);

      expect(respuesta.body).toEqual([
        { fecha: '2026-10-21', rutina: 'Torso', cumplimiento: 33 },
        { fecha: '2026-10-21', rutina: 'Piernas', cumplimiento: 100 },
        { fecha: '2026-10-16', rutina: 'Torso', cumplimiento: 100 },
        { fecha: '2026-10-14', rutina: 'Piernas', cumplimiento: 50 },
      ]);
    });

    it('el cumplimiento no supera el 100 % aunque registre series de más', async () => {
      const respuesta = await asistencia(tokenLaura, juanId).expect(200);

      const cumplimientos = (respuesta.body as { cumplimiento: number }[]).map(
        (s) => s.cumplimiento,
      );
      expect(Math.max(...cumplimientos)).toBeLessThanOrEqual(100);
    });

    it('RN17: no muestra pesos, repeticiones, RIR, récords ni progreso', async () => {
      const respuesta = await asistencia(tokenLaura, juanId).expect(200);

      for (const sesion of respuesta.body as object[]) {
        expect(Object.keys(sesion)).toEqual([
          'fecha',
          'rutina',
          'cumplimiento',
        ]);
      }
    });

    it('filtra por rango de fechas, incluyendo los extremos', async () => {
      const respuesta = await asistencia(tokenLaura, juanId, {
        desde: '2026-10-16',
        hasta: '2026-10-20',
      }).expect(200);

      expect(respuesta.body).toEqual([
        { fecha: '2026-10-16', rutina: 'Torso', cumplimiento: 100 },
      ]);
    });

    it('acepta solo desde o solo hasta', async () => {
      const desde = await asistencia(tokenLaura, juanId, {
        desde: '2026-10-21',
      }).expect(200);
      const hasta = await asistencia(tokenLaura, juanId, {
        hasta: '2026-10-14',
      }).expect(200);

      expect(desde.body).toHaveLength(2);
      expect(hasta.body).toEqual([
        { fecha: '2026-10-14', rutina: 'Piernas', cumplimiento: 50 },
      ]);
    });

    it('sin sesiones en el rango devuelve una lista vacía', async () => {
      const respuesta = await asistencia(tokenLaura, juanId, {
        desde: '2026-11-01',
      }).expect(200);

      expect(respuesta.body).toEqual([]);
    });
  });

  describe('errores', () => {
    it('422 si desde es posterior a hasta', async () => {
      const respuesta = await asistencia(tokenLaura, juanId, {
        desde: '2026-10-21',
        hasta: '2026-10-14',
      }).expect(422);

      expect(respuesta.body).toEqual({
        error: 'La fecha desde no puede ser posterior a la fecha hasta.',
      });
    });

    it('422 si una fecha no es válida', async () => {
      await asistencia(tokenLaura, juanId, { desde: 'ayer' }).expect(422);
    });

    it('422 si el id del deportista no es un número', async () => {
      await asistencia(tokenLaura, 'abc').expect(422);
    });

    it('RN17: 403 si el deportista no está vinculado con el entrenador', async () => {
      const respuesta = await asistencia(tokenLaura, sofiaId).expect(403);

      expect(respuesta.body).toEqual({
        error: 'El deportista no está vinculado con vos.',
      });
    });

    it('RN17: 403 si otro entrenador pide la asistencia de un deportista ajeno', async () => {
      await asistencia(tokenMartin, juanId).expect(403);
    });

    it('403 con un deportista que no existe, igual que uno no vinculado', async () => {
      const respuesta = await asistencia(tokenLaura, 999999999).expect(403);

      expect(respuesta.body).toEqual({
        error: 'El deportista no está vinculado con vos.',
      });
    });

    it('403 si lo pide un deportista, aunque sea su propia asistencia', async () => {
      await asistencia(tokenJuan, juanId).expect(403);
    });

    it('E13: 401 sin token', async () => {
      await asistencia(null, juanId).expect(401);
    });
  });
});
