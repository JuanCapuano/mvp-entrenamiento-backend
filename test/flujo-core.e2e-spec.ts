import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { fechaActual } from '../src/modules/common/helpers/fecha-actual.helper';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanEntrenamiento } from '../src/modules/planificacion/domain/entities/plan-entrenamiento.entity';
import { SesionEntrenamiento } from '../src/modules/registro/domain/entities/sesion-entrenamiento.entity';
import { SerieRegistrada } from '../src/modules/registro/domain/events/serie-registrada.event';
import { RecordPersonalSuperado } from '../src/modules/registro/domain/events/record-personal-superado.event';

// Flujo core contra la app real y MySQL (antes: docker compose up -d):
// register → login → vincular → crear y asignar plan → registrar series → ver la sesión de hoy.
// Los eventos se escuchan en el EventEmitter2 real de la app, sin mocks.
// "Hoy" lo pone el servidor (RN12): la vigencia del plan se calcula con la misma fecha.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';
const LAURA = {
  nombre: 'Laura Gómez',
  email: `laura.core.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};
const JUAN = {
  nombre: 'Juan Pérez',
  email: `juan.core.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};

describe('Flujo core: registrar una serie del plan vigente', () => {
  let app: INestApplication;
  let tokenLaura: string;
  let tokenJuan: string;
  let juanId: number;
  let planId: number;
  let rutinaId: number;
  let ejercicioId: number;
  const hoy = fechaActual();
  const seriesRegistradas: SerieRegistrada[] = [];
  const records: RecordPersonalSuperado[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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

    const bus = app.get(EventEmitter2);
    bus.on('serie.registrada', (e: SerieRegistrada) =>
      seriesRegistradas.push(e),
    );
    bus.on('record-personal.superado', (e: RecordPersonalSuperado) =>
      records.push(e),
    );
  }, 30000);

  // La limpieza va directo a las tablas: las interfaces de los repositorios no tienen "borrar"
  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (juanId) {
      await dataSource
        .getRepository(SesionEntrenamiento)
        .delete({ deportistaId: juanId });
    }
    if (planId) {
      await dataSource.getRepository(PlanEntrenamiento).delete({ id: planId });
    }
    await dataSource
      .getRepository(Usuario)
      .delete({ email: In([LAURA.email, JUAN.email]) });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function ingresar(email: string) {
    const respuesta = await http()
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA })
      .expect(200);
    return respuesta.body as {
      access_token: string;
      usuario: { id: number };
    };
  }

  function registrarSerie(peso: number, repeticiones: number) {
    return http()
      .post('/api/series')
      .set('Authorization', `Bearer ${tokenJuan}`)
      .send({
        rutina_id: rutinaId,
        ejercicio_id: ejercicioId,
        peso,
        repeticiones,
        rir: 2,
      });
  }

  it('el entrenador y el deportista crean su cuenta e ingresan', async () => {
    for (const usuario of [LAURA, JUAN]) {
      await http()
        .post('/api/auth/register')
        .send({ ...usuario, contrasena: CONTRASENA })
        .expect(201);
    }
    tokenLaura = (await ingresar(LAURA.email)).access_token;
    const juan = await ingresar(JUAN.email);
    tokenJuan = juan.access_token;
    juanId = juan.usuario.id;
  });

  it('el entrenador vincula al deportista, crea el plan y se lo asigna con vigencia hoy', async () => {
    await http()
      .post('/api/deportistas')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({ email: JUAN.email })
      .expect(201);

    const catalogo = await http()
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .expect(200);
    ejercicioId = catalogo.body[0].id;

    const plan = await http()
      .post('/api/planes')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({
        nombre: 'Fuerza',
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
    planId = plan.body.id;

    const detalle = await http()
      .get(`/api/planes/${planId}`)
      .set('Authorization', `Bearer ${tokenLaura}`)
      .expect(200);
    rutinaId = detalle.body.rutinas[0].id;

    await http()
      .post(`/api/planes/${planId}/asignaciones`)
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({
        deportista_id: juanId,
        vigencia_desde: hoy,
        vigencia_hasta: hoy,
      })
      .expect(201);
  });

  it('E2: la primera serie se registra (RN3), publica Serie registrada y no es récord (RN9)', async () => {
    const respuesta = await registrarSerie(60, 8).expect(201);

    expect(respuesta.body).toEqual({
      serie_id: expect.any(Number),
      numero: 1,
      record_personal: false,
    });
    expect(seriesRegistradas).toHaveLength(1);
    expect(seriesRegistradas[0]).toMatchObject({
      deportistaId: juanId,
      serieId: respuesta.body.serie_id,
      ejercicioId,
      fecha: hoy,
    });
    expect(records).toHaveLength(0);
  });

  it('E3: una serie que supera la mejor marca avisa el récord y publica los dos eventos', async () => {
    const respuesta = await registrarSerie(65, 8).expect(201);

    expect(respuesta.body).toMatchObject({ numero: 2, record_personal: true });
    expect(seriesRegistradas).toHaveLength(2);
    expect(seriesRegistradas[1].serieId).toBe(respuesta.body.serie_id);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      deportistaId: juanId,
      serieId: respuesta.body.serie_id,
      peso: 65,
      repeticiones: 8,
    });
  });

  it('las dos series quedan guardadas en la sesión de hoy', async () => {
    const respuesta = await http()
      .get('/api/sesiones/hoy')
      .query({ rutina_id: rutinaId })
      .set('Authorization', `Bearer ${tokenJuan}`)
      .expect(200);

    expect(respuesta.body.ejercicios).toEqual([
      {
        ejercicio_id: ejercicioId,
        series_objetivo: 3,
        series: [
          expect.objectContaining({ numero: 1, peso: 60, repeticiones: 8 }),
          expect.objectContaining({ numero: 2, peso: 65, repeticiones: 8 }),
        ],
      },
    ]);
    expect(respuesta.body.cumplimiento).toBe(67);
  });
});
