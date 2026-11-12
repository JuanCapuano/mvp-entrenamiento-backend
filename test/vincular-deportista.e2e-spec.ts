import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { IUsuarioRepositoryToken } from '../src/modules/gestion-usuario/usuario/domain/interfaces/usuario.repository-interface';
import type { IUsuarioRepository } from '../src/modules/gestion-usuario/usuario/domain/interfaces/usuario.repository-interface';

// US-03: POST /api/deportistas contra la app real y MySQL (antes: docker compose up -d).
// El test crea sus propios usuarios con emails únicos y los borra al terminar.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';

// Datos del Paso 10: Laura y Martín son entrenadores, Juan es deportista
const LAURA = {
  nombre: 'Laura Gómez',
  email: `laura.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};
const MARTIN = {
  nombre: 'Martín Díaz',
  email: `martin.${sufijo}@e2e.test`,
  rol: 'ENTRENADOR',
};
const JUAN = {
  nombre: 'Juan Pérez',
  email: `juan.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};

describe('POST /api/deportistas (US-03)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let tokenLaura: string;
  let tokenMartin: string;
  let tokenJuan: string;
  let lauraId: number;
  let juanId: number;

  // Los tests corren en orden: el vínculo que crea el 201 lo usan los dos últimos
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

    for (const usuario of [LAURA, MARTIN, JUAN]) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...usuario, contrasena: CONTRASENA })
        .expect(201);
    }

    ({ token: tokenLaura, id: lauraId } = await ingresar(LAURA.email));
    ({ token: tokenMartin } = await ingresar(MARTIN.email));
    ({ token: tokenJuan, id: juanId } = await ingresar(JUAN.email));
  }, 30000);

  // La limpieza va directo a la tabla: la interfaz del repositorio no tiene "borrar"
  afterAll(async () => {
    await app
      .get(DataSource)
      .getRepository(Usuario)
      .delete({ email: In([LAURA.email, MARTIN.email, JUAN.email]) });
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

  function vincular(token: string, email: string) {
    return request(app.getHttpServer())
      .post('/api/deportistas')
      .set('Authorization', `Bearer ${token}`)
      .send({ email });
  }

  it('401 sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/deportistas')
      .send({ email: JUAN.email })
      .expect(401);
  });

  it('403 si lo pide un deportista', async () => {
    await vincular(tokenJuan, JUAN.email).expect(403);
  });

  it('422 si el email no tiene formato válido', async () => {
    const respuesta = await vincular(tokenLaura, 'no-es-un-email').expect(422);
    expect(respuesta.body).toEqual({
      error: 'El email no tiene un formato válido.',
    });
  });

  it('422 si el email no corresponde a ninguna cuenta', async () => {
    const respuesta = await vincular(
      tokenLaura,
      `nadie.${sufijo}@e2e.test`,
    ).expect(422);
    expect(respuesta.body).toEqual({
      error: 'El email no corresponde a una cuenta de deportista.',
    });
  });

  it('422 si el email es de un entrenador', async () => {
    const respuesta = await vincular(tokenLaura, MARTIN.email).expect(422);
    expect(respuesta.body).toEqual({
      error: 'El email no corresponde a una cuenta de deportista.',
    });
  });

  it('201 vincula al deportista y queda guardado con el entrenador_id del entrenador', async () => {
    const respuesta = await vincular(tokenLaura, JUAN.email).expect(201);
    expect(respuesta.body).toEqual({
      id: juanId,
      nombre: 'Juan Pérez',
      email: JUAN.email,
    });

    // Se lee con el mismo repositorio que usa la app, sacado del contenedor de Nest
    //get() permite obtener la instancia del repositorio que se inyecta en el use-case
    const usuarios = moduleRef.get<IUsuarioRepository>(IUsuarioRepositoryToken);
    const juan = await usuarios.buscarPorEmail(JUAN.email);
    expect(juan?.entrenadorId).toBe(lauraId);
  });

  it('422 si el deportista ya está vinculado con vos', async () => {
    const respuesta = await vincular(tokenLaura, JUAN.email).expect(422);
    expect(respuesta.body).toEqual({
      error: 'Juan Pérez ya está vinculado con vos.',
    });
  });

  it('E12: 422 si el deportista ya tiene otro entrenador', async () => {
    const respuesta = await vincular(tokenMartin, JUAN.email).expect(422);
    expect(respuesta.body).toEqual({
      error: 'Juan Pérez ya tiene entrenador.',
    });
  });
});
