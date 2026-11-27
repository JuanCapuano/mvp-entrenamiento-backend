import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { fechaActual } from '../src/modules/common/helpers/fecha-actual.helper';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanEntrenamiento } from '../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';

// US-13 (GET /api/plan-vigente) y US-04 (plan vigente en GET /api/deportistas)
// contra la app real y MySQL (antes: docker compose up -d).
// Crea sus propios usuarios con emails únicos y los borra al terminar.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';

const usuario = (nombre: string, rol: string) => ({
  nombre,
  email: `${nombre.toLowerCase()}.${sufijo}@e2e-vigente.test`,
  rol,
});
const LAURA = usuario('Laura', 'ENTRENADOR');
const JUAN = usuario('Juan', 'DEPORTISTA'); // plan vigente hoy
const SOFIA = usuario('Sofia', 'DEPORTISTA'); // vigencia futura
const PABLO = usuario('Pablo', 'DEPORTISTA'); // vigencia vencida
const NADIA = usuario('Nadia', 'DEPORTISTA'); // sin asignación

// Fecha de hoy +/- n días, en 'YYYY-MM-DD' (sin depender del huso horario del equipo)
function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

describe('Plan vigente (US-13) y lista de deportistas (US-04)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let tokenLaura: string;
  let tokenJuan: string;
  let tokenSofia: string;
  let tokenPablo: string;
  let tokenNadia: string;
  const ids: Record<string, number> = {};
  const planIds: number[] = [];
  let ejercicios: { id: number; nombre: string }[];

  const hoy = fechaActual();

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

    for (const u of [LAURA, JUAN, SOFIA, PABLO, NADIA]) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...u, contrasena: CONTRASENA })
        .expect(201);
    }

    tokenLaura = (await ingresar(LAURA.email)).token;
    ({ token: tokenJuan, id: ids.juan } = await ingresar(JUAN.email));
    ({ token: tokenSofia, id: ids.sofia } = await ingresar(SOFIA.email));
    ({ token: tokenPablo, id: ids.pablo } = await ingresar(PABLO.email));
    ({ token: tokenNadia, id: ids.nadia } = await ingresar(NADIA.email));

    for (const u of [JUAN, SOFIA, PABLO, NADIA]) {
      await request(app.getHttpServer())
        .post('/api/deportistas')
        .set('Authorization', `Bearer ${tokenLaura}`)
        .send({ email: u.email })
        .expect(201);
    }

    const catalogo = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .expect(200);
    ejercicios = catalogo.body.slice(0, 3);

    // Plan de Juan: 2 rutinas; el mismo ejercicio en las dos es válido (US-07)
    const planJuan = await crearPlan('Plan Chad', [
      { nombre: 'Día 1', ejercicios: [ejercicios[2].id, ejercicios[0].id] },
      { nombre: 'Día 2', ejercicios: [ejercicios[0].id] },
    ]);
    const planSimple = await crearPlan('Plan simple', [
      { nombre: 'Piernas', ejercicios: [ejercicios[1].id] },
    ]);
    planIds.push(planJuan, planSimple);

    await asignar(planJuan, ids.juan, sumarDias(hoy, -5), sumarDias(hoy, 5));
    await asignar(planSimple, ids.sofia, sumarDias(hoy, 10), sumarDias(hoy, 20));
    await asignar(planSimple, ids.pablo, sumarDias(hoy, -20), sumarDias(hoy, -10));
  }, 60000);

  // La limpieza va directo a las tablas (las asignaciones caen por cascade con el plan)
  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.getRepository(PlanEntrenamiento).delete({ id: In(planIds) });
    await dataSource.getRepository(Usuario).delete({
      email: In([LAURA, JUAN, SOFIA, PABLO, NADIA].map((u) => u.email)),
    });
    await app.close();
  });

  async function ingresar(email: string): Promise<{ token: string; id: number }> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA })
      .expect(200);
    return { token: respuesta.body.access_token, id: respuesta.body.usuario.id };
  }

  async function crearPlan(
    nombre: string,
    rutinas: { nombre: string; ejercicios: number[] }[],
  ): Promise<number> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/planes')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({
        nombre,
        // Si CrearPlanDto no acepta "indicaciones" con este nombre, quitá esta línea
        indicaciones: 'Entrada en calor de 10 minutos',
        rutinas: rutinas.map((r) => ({
          nombre: r.nombre,
          dosificaciones: r.ejercicios.map((ejercicioId, i) => ({
            ejercicio_id: ejercicioId,
            orden: i + 1,
            series_objetivo: 3,
            reps_min: 8,
            reps_max: 10,
            rir_objetivo: 2,
          })),
        })),
      })
      .expect(201);
    return respuesta.body.id;
  }

  async function asignar(planId: number, deportistaId: number, desde: string, hasta: string) {
    await request(app.getHttpServer())
      .post(`/api/planes/${planId}/asignaciones`)
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({ deportista_id: deportistaId, vigencia_desde: desde, vigencia_hasta: hasta })
      .expect(201);
  }

  function verPlanVigente(token: string) {
    return request(app.getHttpServer())
      .get('/api/plan-vigente')
      .set('Authorization', `Bearer ${token}`);
  }

  describe('GET /api/plan-vigente (US-13)', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/plan-vigente').expect(401);
    });

    it('403 si lo pide un entrenador', async () => {
      await verPlanVigente(tokenLaura).expect(403);
    });

    it('200 muestra plan, vigencia, entrenador e indicaciones', async () => {
      const { body } = await verPlanVigente(tokenJuan).expect(200);
      expect(body).toMatchObject({
        nombre: 'Plan Chad',
        entrenador_nombre: LAURA.nombre,
        vigencia: { desde: sumarDias(hoy, -5), hasta: sumarDias(hoy, 5) },
        indicaciones: 'Entrada en calor de 10 minutos',
      });
    });

    it('200 rutinas y ejercicios en el orden definido, con id y dosificación', async () => {
      const { body } = await verPlanVigente(tokenJuan).expect(200);

      expect(body.rutinas.map((r: any) => r.nombre)).toEqual(['Día 1', 'Día 2']);
      expect(body.rutinas.every((r: any) => typeof r.id === 'number')).toBe(true);

      const dia1 = body.rutinas[0].dosificaciones;
      expect(dia1.map((d: any) => [d.orden, d.ejercicio_id])).toEqual([
        [1, ejercicios[2].id],
        [2, ejercicios[0].id],
      ]);
      expect(dia1[0]).toMatchObject({
        ejercicio_nombre: ejercicios[2].nombre,
        series_objetivo: 3,
        reps_min: 8,
        reps_max: 10,
        rir_objetivo: 2,
      });
    });

    it('200 el mismo ejercicio aparece en distintas rutinas (US-07)', async () => {
      const { body } = await verPlanVigente(tokenJuan).expect(200);
      const idsDia2 = body.rutinas[1].dosificaciones.map((d: any) => d.ejercicio_id);
      expect(idsDia2).toEqual([ejercicios[0].id]);
    });

    it('404 si el deportista no tiene ninguna asignación', async () => {
      await verPlanVigente(tokenNadia).expect(404);
    });

    it('404 si la vigencia todavía no empezó', async () => {
      await verPlanVigente(tokenSofia).expect(404);
    });

    it('404 si la vigencia ya terminó', async () => {
      await verPlanVigente(tokenPablo).expect(404);
    });

    it('no existe ningún endpoint para modificar el plan como deportista', async () => {
      await request(app.getHttpServer())
        .put('/api/plan-vigente')
        .set('Authorization', `Bearer ${tokenJuan}`)
        .send({ nombre: 'Hackeado' })
        .expect(404);
    });
  });

  describe('GET /api/deportistas (US-04)', () => {
    async function lista() {
      const { body } = await request(app.getHttpServer())
        .get('/api/deportistas')
        .set('Authorization', `Bearer ${tokenLaura}`)
        .expect(200);
      return (id: number) => body.find((d: any) => d.id === id);
    }

    it('403 si lo pide un deportista', async () => {
      await request(app.getHttpServer())
        .get('/api/deportistas')
        .set('Authorization', `Bearer ${tokenJuan}`)
        .expect(403);
    });

    it('incluye el plan vigente de hoy con su vigencia', async () => {
      const deportista = (await lista())(ids.juan);
      expect(deportista.plan_vigente).toEqual({
        nombre: 'Plan Chad',
        vigencia_desde: sumarDias(hoy, -5),
        vigencia_hasta: sumarDias(hoy, 5),
      });
    });

    it('plan_vigente es null si la vigencia es futura, vencida o no hay asignación', async () => {
      const buscar = await lista();
      expect(buscar(ids.sofia).plan_vigente).toBeNull();
      expect(buscar(ids.pablo).plan_vigente).toBeNull();
      expect(buscar(ids.nadia).plan_vigente).toBeNull();
    });
  });
});