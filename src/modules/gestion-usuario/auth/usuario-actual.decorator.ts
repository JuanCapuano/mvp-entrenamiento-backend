// gestion-usuario/auth/usuario-actual.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolNombre } from '../rol/domain/enums/rol-nombre.enum';

export interface UsuarioToken {
  id: number;
  rol: RolNombre;
}

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest(); // req.user lo carga el AuthGuard con el id y el rol del token
    return request.user; // { id, rol }, lo cargó el AuthGuard
  },
);
