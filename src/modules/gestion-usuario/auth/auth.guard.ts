import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RolNombre } from '../rol/domain/enums/rol-nombre.enum';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import { JwtPayload } from './jwt-payload.interface';

// Guard global (APP_GUARD en AuthModule):
// 1. Rutas con @Public() → pasan sin token.
// 2. El resto exige un access token válido → 401 si no.
//    El id y el rol salen del token: no se consulta la base.
// 3. Si la ruta tiene @Roles(...), el rol del token tiene que estar en la lista → 403 si no.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (esPublica) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: number; rol: RolNombre } }>();

    const token = this.extraerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token no encontrado.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token inválido o vencido.');
    }

    request.user = { id: payload.sub, rol: payload.rol };

    const requiredRoles = this.reflector.getAllAndOverride<RolNombre[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    if (!requiredRoles.includes(payload.rol)) {
      throw new ForbiddenException(
        'No tenés permisos para realizar esta acción.',
      );
    }

    return true;
  }

  private extraerToken(request: Request): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
