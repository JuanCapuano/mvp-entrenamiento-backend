import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { ProgresoQuery } from '../queries/progreso.query';
import { ProgresoQueryService } from '../queries/progreso.query-service';

// Progreso del deportista (US-19). Sin lógica: el controlador solo delega.
@Controller('progreso')
export class ProgresoController {
  constructor(private readonly queryService: ProgresoQueryService) {}

  // GET /api/progreso?ejercicio_id → 200 { record, por_fecha: [{ fecha, peso_maximo, rm_estimado, mejor_serie, volumen }] }
  @Get()
  @Roles(RolNombre.DEPORTISTA)
  buscarProgreso(
    @UsuarioActual() usuario: UsuarioToken,
    @Query() query: ProgresoQuery,
  ) {
    return this.queryService.buscarProgreso(usuario.id, query.ejercicio_id);
  }

  // GET /api/progreso/ejercicios → 200 [{ id, nombre }]
  @Get('ejercicios')
  @Roles(RolNombre.DEPORTISTA)
  buscarEjerciciosConProgreso(@UsuarioActual() usuario: UsuarioToken) {
    return this.queryService.buscarEjerciciosConProgreso(usuario.id);
  }
}
