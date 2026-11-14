import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { fechaActual } from '../src/modules/common/helpers/fecha-actual.helper';
import { Usuario } from '../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { MedicionCorporal } from '../src/modules/mediciones/domain/entities/medicion-corporal.entity';

// US-21: POST y GET /api/mediciones contra la app real y MySQL (antes: docker compose up -d).
// El test crea sus propios usuarios con emails únicos y los borra al terminar.

const sufijo = Date.now();
const CONTRASENA = 'demo1234';

// Datos del Paso 10: Laura y Martín son entrenadores; Juan (vinculado a Laura) y Sofía, deportistas
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
const SOFIA = {
  nombre: 'Sofía Ruiz',
  email: `sofia.${sufijo}@e2e.test`,
  rol: 'DEPORTISTA',
};

describe('/api/mediciones (US-21)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let tokenLaura: string;
  let tokenMartin: string;
  let tokenJuan: string;
  let tokenSofia: string;
  let juanId: number;
  let sofiaId: number;
  let medicionId: number;

  // Los tests corren en orden: la medición que crea el 201 la usan los siguientes
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

    ({ token: tokenLaura } = await ingresar(LAURA.email));
    ({ token: tokenMartin } = await ingresar(MARTIN.email));
    ({ token: tokenJuan, id: juanId } = await ingresar(JUAN.email));
    ({ token: tokenSofia, id: sofiaId } = await ingresar(SOFIA.email));

    // Laura vincula a Juan (US-03)
    await request(app.getHttpServer())
      .post('/api/deportistas')
      .set('Authorization', `Bearer ${tokenLaura}`)
      .send({ email: JUAN.email })
      .expect(201);
  }, 30000);

  // La limpieza va directo a las tablas: las interfaces de los repositorios no tienen "borrar"
  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource
      .getRepository(MedicionCorporal)
      .delete({ deportistaId: In([juanId, sofiaId]) });
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

  function registrar(token: string, cuerpo: object) {
    return request(app.getHttpServer())
      .post('/api/mediciones')
      .set('Authorization', `Bearer ${token}`)
      .send(cuerpo);
  }

  function listar(token: string, query: object = {}) {
    return request(app.getHttpServer())
      .get('/api/mediciones')
      .set('Authorization', `Bearer ${token}`)
      .query(query);
  }

  describe('POST /api/mediciones', () => {
    it('E13: 401 sin token', async () => {
      await request(app.getHttpServer())
        .post('/api/mediciones')
        .send({ peso_corporal: 78.4, altura: 1.76 })
        .expect(401);
    });

    it('403 si lo pide un entrenador', async () => {
      await registrar(tokenLaura, { peso_corporal: 78.4, altura: 1.76 }).expect(
        403,
      );
    });

    it('422 si el peso corporal no es mayor a 0 (RN19)', async () => {
      const respuesta = await registrar(tokenJuan, {
        peso_corporal: 0,
        altura: 1.76,
      }).expect(422);
      expect(respuesta.body).toEqual({
        error: 'El peso corporal tiene que ser mayor a 0.',
      });
    });

    it('422 si la altura no es mayor a 0 (RN19)', async () => {
      const respuesta = await registrar(tokenJuan, {
        peso_corporal: 78.4,
        altura: -1,
      }).expect(422);
      expect(respuesta.body).toEqual({
        error: 'La altura tiene que ser mayor a 0.',
      });
    });

    it('422 si el cliente manda la fecha: la pone el servidor', async () => {
      await registrar(tokenJuan, {
        peso_corporal: 78.4,
        altura: 1.76,
        fecha: '2026-10-20',
      }).expect(422);
    });

    it('201 guarda la medición con la fecha del día', async () => {
      const respuesta = await registrar(tokenJuan, {
        peso_corporal: 78.4,
        altura: 1.76,
      }).expect(201);

      expect(respuesta.body).toEqual({
        id: expect.any(Number),
        fecha: fechaActual(),
      });
      medicionId = respuesta.body.id;
    });

    it('201 si carga otra el mismo día, reemplaza a la anterior (RN19)', async () => {
      const respuesta = await registrar(tokenJuan, {
        peso_corporal: 77.9,
        altura: 1.77,
      }).expect(201);
      expect(respuesta.body).toEqual({ id: medicionId, fecha: fechaActual() });

      const lista = await listar(tokenJuan).expect(200);
      expect(lista.body).toEqual([
        { fecha: fechaActual(), peso_corporal: 77.9, altura: 1.77 },
      ]);
    });
  });

  describe('GET /api/mediciones', () => {
    it('E13: 401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/mediciones').expect(401);
    });

    it('200 el deportista ve solo sus mediciones', async () => {
      const respuesta = await listar(tokenSofia).expect(200);
      expect(respuesta.body).toEqual([]);
    });

    it('200 filtra por rango de fechas', async () => {
      const respuesta = await listar(tokenJuan, {
        desde: '2000-01-01',
        hasta: '2000-12-31',
      }).expect(200);
      expect(respuesta.body).toEqual([]);
    });

    it('422 si una fecha del filtro no tiene el formato AAAA-MM-DD', async () => {
      await listar(tokenJuan, { desde: '21/10/2026' }).expect(422);
    });

    it('403 si un deportista pide las mediciones de otro (RN17)', async () => {
      await listar(tokenSofia, { deportista_id: juanId }).expect(403);
    });

    it('200 el entrenador ve las mediciones de su deportista vinculado', async () => {
      const respuesta = await listar(tokenLaura, {
        deportista_id: juanId,
      }).expect(200);
      expect(respuesta.body).toEqual([
        { fecha: fechaActual(), peso_corporal: 77.9, altura: 1.77 },
      ]);
    });

    it('403 si el deportista no está vinculado con el entrenador (RN17)', async () => {
      const respuesta = await listar(tokenMartin, {
        deportista_id: juanId,
      }).expect(403);
      expect(respuesta.body).toEqual({
        error: 'El deportista no está vinculado con vos.',
      });
    });

    it('422 si el entrenador no indica el deportista', async () => {
      await listar(tokenLaura).expect(422);
    });
  });
});
