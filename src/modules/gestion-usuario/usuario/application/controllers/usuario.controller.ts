import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsuarioQueryService } from '../queries/usuario.query-service';

// Sin @Roles: cualquier usuario autenticado (entrenador o deportista)
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly queryService: UsuarioQueryService) {}

  // req.user lo carga el AuthGuard con el id y el rol del token
  @Get('perfil')
  buscarPerfil(@Req() req: Request & { user: { id: number } }) {
    return this.queryService.buscarPerfil(req.user.id);
  }
}
