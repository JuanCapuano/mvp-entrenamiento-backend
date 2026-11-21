import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { PlanesQueryService } from '../queries/planes.query-service';

// US13, el deportista solo puede ver su plan
@Controller('plan-vigente')
@Roles(RolNombre.DEPORTISTA)
export class PlanVigenteController {
  constructor(private readonly queryService: PlanesQueryService) {}

  @Get()
  buscarPlanVigente(@UsuarioActual() usuario: UsuarioToken) {
    return this.queryService.buscarPlanVigente(usuario.id);
  }
}