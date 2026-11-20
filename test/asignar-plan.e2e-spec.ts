import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanEntrenamiento } from '../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';

// US-08: POST /api/planes/{id}/asignaciones contra la app real y MySQL (antes: docker compose up -d).
// Escenarios del Paso 10: E9 (superposición), E11 (no vinculado) y E14 (mismo plan, otro deportista).
// El test crea sus propios usuarios con emails únicos y los borra al terminar.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';

const LAURA = {
  nombre: 'Laura Gómez',
  email: `laura.${sufijo}@e2e-asignar.test`,
  rol: 'ENTRENADOR',
};
const MARTIN = {
  nombre: 'Martín Díaz',
  email: `martin.${sufijo}@e2e-asignar.test`,
  rol: 'ENTRENADOR',
};
const JUAN = {
  nombre: 'Juan Pérez',
  email: `juan.${sufijo}@e2e-asignar.test`,
  rol: 'DEPORTISTA',
};
const SOFIA = {
  nombre: 'Sofía Ruiz',
  email: `sofia.${sufijo}@e2e-asignar.test`,
  rol: 'DEPORTISTA',
};

describe('POST /api/planes/{id}/asignaciones (US-08)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let tokenLaura: string;
  let tokenMartin: string;
  let tokenJuan: string;
  let juanId: number;
  let sofiaId: number;
  let planFuerzaId: number;
  let planFuerza2Id: number;

  // Los tests corren en orden: cada asignación que crea un 201 la usan los siguientes
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Misma configuración que main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();

    for (const usuario of [LAURA, MARTIN, JUAN, SOFIA]) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...usuario, contrasena: CONTRASENA })
        .expect(201);
    }

    tokenLaura = (await ingresar(LAURA.email)).token;
    tokenMartin = (await ingresar(MARTIN.email)).token;
    ({ token: tokenJuan, id: juanId } = await ingresar(JUAN.email));
    ({ id: sofiaId } = await ingresar(SOFIA.email));

    // Laura vincula a Juan; Sofía queda sin entrenador (E11)
    await request(app.getHttpServer())
      .post('/api/deportistas')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({ email: JUAN.email })
      .expect(201);

    const catalogo = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .expect(200);
    const ejercicioId: number = catalogo.body[0].id;

    planFuerzaId = await crearPlan('Fuerza', ejercicioId);
    planFuerza2Id = await crearPlan('Fuerza 2', ejercicioId);
  }, 30000);

  // La limpieza va directo a las tablas: las interfaces de los repositorios no tienen "borrar"
  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource
      .getRepository(PlanEntrenamiento)
      .delete({ id: In([planFuerzaId, planFuerza2Id]) });
    await dataSource.getRepository(Usuario).delete({
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

  async function crearPlan(
    nombre: string,
    ejercicioId: number,
  ): Promise<number> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/planes')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({
        nombre,
        rutinas: [
          {
            nombre: 'Piernas',
            dosificaciones: [
              {
                ejercicio_id: ejercicioId,
                orden: 1,
                series_objetivo: 3,
                reps_min: 8,
                reps_max: 10,
                rir_objetivo: 2,
              },
            ],
          },
        ],
      })
      .expect(201);
    return respuesta.body.id;
  }

  function asignar(token: string, planId: number, cuerpo: object) {
    return request(app.getHttpServer())
      .post(`/api/planes/${planId}/asignaciones`)
      .set('Authorization', `Bearer ${token}`)
      .send(cuerpo);
  }

  it('401 sin token', async () => {
    await request(app.getHttpServer())
      .post(`/api/planes/${planFuerzaId}/asignaciones`)
      .send({
        deportista_id: juanId,
        vigencia_desde: '2026-10-01',
        vigencia_hasta: '2026-11-30',
      })
      .expect(401);
  });

  it('403 si lo pide un deportista', async () => {
    await asignar(tokenJuan, planFuerzaId, {
      deportista_id: juanId,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    }).expect(403);
  });

  it('404 si el plan no existe', async () => {
    await asignar(tokenLaura, 999999, {
      deportista_id: juanId,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    }).expect(404);
  });

  it('403 si el plan lo armó otro entrenador', async () => {
    await asignar(tokenMartin, planFuerzaId, {
      deportista_id: juanId,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    }).expect(403);
  });

  it('422 si la fecha de inicio es posterior a la de fin', async () => {
    const respuesta = await asignar(tokenLaura, planFuerzaId, {
      deportista_id: juanId,
      vigencia_desde: '2026-12-01',
      vigencia_hasta: '2026-11-30',
    }).expect(422);
    expect(respuesta.body).toEqual({
      error: 'La fecha de inicio no puede ser posterior a la de fin.',
    });
  });

  it('E11: 422 si el deportista no está vinculado con el entrenador', async () => {
    const respuesta = await asignar(tokenLaura, planFuerzaId, {
      deportista_id: sofiaId,
      vigencia_desde: '2026-10-15',
      vigencia_hasta: '2026-12-15',
    }).expect(422);
    expect(respuesta.body).toEqual({
      error: 'El deportista no está vinculado con vos.',
    });
  });

  it('201 asigna el plan a Juan con su vigencia', async () => {
    const respuesta = await asignar(tokenLaura, planFuerzaId, {
      deportista_id: juanId,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    }).expect(201);
    expect(respuesta.body).toEqual({
      plan_id: planFuerzaId,
      deportista_id: juanId,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    });
  });

  it('E9: 422 si la vigencia se superpone con otro plan del deportista', async () => {
    const respuesta = await asignar(tokenLaura, planFuerza2Id, {
      deportista_id: juanId,
      vigencia_desde: '2026-11-15',
      vigencia_hasta: '2026-12-15',
    }).expect(422);
    expect(respuesta.body).toEqual({
      error: 'Se superpone con el plan vigente (01/10 al 30/11).',
    });
  });

  it('201 si la vigencia empieza después de la de Juan', async () => {
    await asignar(tokenLaura, planFuerza2Id, {
      deportista_id: juanId,
      vigencia_desde: '2026-12-01',
      vigencia_hasta: '2026-12-31',
    }).expect(201);
  });

  it('E14: el mismo plan se asigna a otro deportista con sus propias fechas', async () => {
    // Sofía se vincula con Laura y recibe el plan Fuerza, que Juan ya está haciendo
    await request(app.getHttpServer())
      .post('/api/deportistas')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({ email: SOFIA.email })
      .expect(201);

    const respuesta = await asignar(tokenLaura, planFuerzaId, {
      deportista_id: sofiaId,
      vigencia_desde: '2026-10-15',
      vigencia_hasta: '2026-12-15',
    }).expect(201);
    expect(respuesta.body).toEqual({
      plan_id: planFuerzaId,
      deportista_id: sofiaId,
      vigencia_desde: '2026-10-15',
      vigencia_hasta: '2026-12-15',
    });
  });
});
