import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';
import { RolNombre } from '../rol/domain/enums/rol-nombre.enum';

// Simula una ruta con @Roles(ENTRENADOR), como POST /api/planes
describe('AuthGuard (E13, RN17)', () => {
  const JWT_SECRET = 'secreto-access';
  const jwt = new JwtService();
  const config = {
    getOrThrow: () => JWT_SECRET,
  } as unknown as ConfigService;
  const reflector = {
    getAllAndOverride: (clave: string) =>
      clave === ROLES_KEY ? [RolNombre.ENTRENADOR] : false,
  } as unknown as Reflector;
  const guard = new AuthGuard(jwt, reflector, config);

  const contexto = (authorization?: string) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as unknown as ExecutionContext;

  const token = (rol: RolNombre) =>
    jwt.signAsync({ sub: 1, rol }, { secret: JWT_SECRET });

  it('sin token responde 401', async () => {
    await expect(guard.canActivate(contexto())).rejects.toThrow(
      new UnauthorizedException('Token no encontrado.'),
    );
  });

  it('con el token de un deportista en una ruta de entrenador responde 403', async () => {
    const deportista = await token(RolNombre.DEPORTISTA);
    await expect(
      guard.canActivate(contexto(`Bearer ${deportista}`)),
    ).rejects.toThrow(
      new ForbiddenException('No tenés permisos para realizar esta acción.'),
    );
  });

  it('con el token de un entrenador deja pasar', async () => {
    const entrenador = await token(RolNombre.ENTRENADOR);
    await expect(
      guard.canActivate(contexto(`Bearer ${entrenador}`)),
    ).resolves.toBe(true);
  });
});
