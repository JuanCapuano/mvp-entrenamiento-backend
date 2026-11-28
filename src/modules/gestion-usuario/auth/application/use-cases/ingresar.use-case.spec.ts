import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IngresarUseCase } from './ingresar.use-case';
import { GeneradorToken } from '../../generador-token';
import { UsuarioRepositorioEnMemoria } from '../../../../../../test/repositorios-en-memoria/usuario.repositorio-en-memoria';
import { Usuario } from '../../../usuario/domain/entities/usuario.entity';
import { Rol } from '../../../rol/domain/entities/rol.entity';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import type { JwtPayload } from '../../jwt-payload.interface';

describe('IngresarUseCase (US-02)', () => {
  const JWT_SECRET = 'secreto-access';
  const config = {
    getOrThrow: (clave: string) =>
      clave === 'JWT_SECRET' ? JWT_SECRET : 'secreto-refresh',
    get: (_clave: string, porDefecto: string) => porDefecto,
  } as unknown as ConfigService;
  const jwt = new JwtService();
  let caso: IngresarUseCase;

  beforeAll(async () => {
    const juan = Object.assign(new Usuario(), {
      id: 3,
      nombre: 'Juan Pérez',
      email: 'juan@mail.com',
      contrasena: await bcrypt.hash('demo1234', 4),
      rol: Object.assign(new Rol(), { id: 2, nombre: RolNombre.DEPORTISTA }),
    });
    caso = new IngresarUseCase(
      new UsuarioRepositorioEnMemoria([juan]),
      new GeneradorToken(jwt, config),
    );
  });

  it('con email y contraseña correctos devuelve los tokens y el usuario sin contraseña', async () => {
    const respuesta = await caso.execute({
      email: 'juan@mail.com',
      contrasena: 'demo1234',
    });

    expect(respuesta).toEqual({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      usuario: {
        id: 3,
        nombre: 'Juan Pérez',
        email: 'juan@mail.com',
        rol: RolNombre.DEPORTISTA,
      },
    });
  });

  it('el access token está firmado con JWT_SECRET y lleva { sub, rol }', async () => {
    const { access_token } = await caso.execute({
      email: 'juan@mail.com',
      contrasena: 'demo1234',
    });

    const payload = await jwt.verifyAsync<JwtPayload>(access_token, {
      secret: JWT_SECRET,
    });
    expect(payload).toMatchObject({ sub: 3, rol: RolNombre.DEPORTISTA });
  });

  it.each([
    ['la contraseña es incorrecta', 'juan@mail.com', 'otra1234'],
    ['el usuario no existe', 'nadie@mail.com', 'demo1234'],
  ])(
    'si %s responde 401 con el mismo mensaje',
    async (_caso, email, contrasena) => {
      await expect(caso.execute({ email, contrasena })).rejects.toThrow(
        new UnauthorizedException('Email o contraseña incorrectos.'),
      );
    },
  );
});
