import { Controller, Get } from '@nestjs/common';
import { UsuarioQueryService } from '../queries/usuario.query-service';
import { UsuarioActual } from '../../../auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../auth/usuario-actual.decorator';

// Sin @Roles: cualquier usuario autenticado (entrenador o deportista)
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly queryService: UsuarioQueryService) {}

  // req.user lo carga el AuthGuard con el id y el rol del token
  @Get('perfil')
  buscarPerfil(@UsuarioActual() usuario: UsuarioToken) {
    return this.queryService.buscarPerfil(usuario.id);
  }
}
