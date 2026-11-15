import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';

// Registro conectado a la app real (AppModule + MySQL), con el login de verdad.
// Hoy planificación todavía no tiene asignaciones (US-08) ni plan vigente (US-13): ningún
// deportista tiene plan vigente, y estos tests dejan asentado cómo responde registro mientras tanto.
// Cuando el plan vigente exista, los casos de "sin plan vigente" hay que revisarlos.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';
const JUAN = {
  nombre: 'Juan Pérez',
  email: `juan.registro.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};
const LAURA = {
  nombre: 'Laura Gómez',
  email: `laura.registro.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};

describe('Registro en la app real', () => {
  let app: INestApplication;
  let tokenJuan: string;
  let tokenLaura: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
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

    for (const usuario of [JUAN, LAURA]) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...usuario, contrasena: CONTRASENA })
        .expect(201);
    }
    tokenJuan = await ingresar(JUAN.email);
    tokenLaura = await ingresar(LAURA.email);
  }, 30000);

  afterAll(async () => {
    await app
      .get(DataSource)
      .getRepository(Usuario)
      .delete({ email: In([JUAN.email, LAURA.email]) });
    await app.close();
  });

  async function ingresar(email: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA })
      .expect(200);
    return respuesta.body.access_token;
  }

  const con = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('US-14: las últimas series están expuestas; sin historial, fecha null y series vacías', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/ejercicios/1/ultimas-series')
      .set(con(tokenJuan))
      .expect(200);

    expect(respuesta.body).toEqual({ fecha: null, series: [] });
  });

  it('el catálogo sigue respondiendo en /api/ejercicios (no lo pisa la ruta de últimas series)', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .set(con(tokenLaura))
      .expect(200);

    expect(respuesta.body.length).toBeGreaterThan(0);
  });

  it('US-15: sin plan vigente no se puede registrar una serie (422)', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/series')
      .set(con(tokenJuan))
      .send({
        rutina_id: 1,
        ejercicio_id: 1,
        peso: 60,
        repeticiones: 8,
        rir: 2,
      })
      .expect(422);

    expect(respuesta.body).toEqual({ error: 'No tenés un plan vigente.' });
  });

  it('US-16: sin plan vigente la sesión de hoy responde 403', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sesiones/hoy')
      .query({ rutina_id: 1 })
      .set(con(tokenJuan))
      .expect(403);

    expect(respuesta.body).toEqual({
      error: 'La rutina no es de tu plan vigente.',
    });
  });

  it('US-17: corregir una serie que no existe responde 404', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/api/series/2147483000')
      .set(con(tokenJuan))
      .send({ peso: 65, repeticiones: 8, rir: 2 })
      .expect(404);

    expect(respuesta.body).toEqual({ error: 'La serie no existe.' });
  });

  it('E13: los endpoints de registro exigen token (401)', async () => {
    const servidor = app.getHttpServer();
    await request(servidor).post('/api/series').send({}).expect(401);
    await request(servidor).patch('/api/series/1').send({}).expect(401);
    await request(servidor).get('/api/sesiones/hoy').expect(401);
    await request(servidor).get('/api/ejercicios/1/ultimas-series').expect(401);
  });

  it('RN1: el entrenador no puede usar los endpoints de registro (403)', async () => {
    const servidor = app.getHttpServer();
    const cuerpo = { peso: 65, repeticiones: 8, rir: 2 };
    await request(servidor)
      .post('/api/series')
      .set(con(tokenLaura))
      .send({ rutina_id: 1, ejercicio_id: 1, ...cuerpo })
      .expect(403);
    await request(servidor)
      .patch('/api/series/1')
      .set(con(tokenLaura))
      .send(cuerpo)
      .expect(403);
    await request(servidor)
      .get('/api/sesiones/hoy')
      .query({ rutina_id: 1 })
      .set(con(tokenLaura))
      .expect(403);
    await request(servidor)
      .get('/api/ejercicios/1/ultimas-series')
      .set(con(tokenLaura))
      .expect(403);
  });
});
