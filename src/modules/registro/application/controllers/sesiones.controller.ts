import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { SesionDeHoyQuery } from '../queries/sesion-de-hoy.query';
import { SesionesQueryService } from '../queries/sesiones.query-service';
import { SesionesQuery } from '../queries/sesiones.query';
import { Rol } from '../../../gestion-usuario/rol/domain/entities/rol.entity';

// Consultas del registro de entrenamiento (Paso 11). Sin lógica: el controlador solo delega.
// Las rutas no comparten prefijo, así que cada una declara la suya completa.
@Controller()
export class SesionesController {
  constructor(private readonly queryService: SesionesQueryService) {}

  // GET /api/sesiones/hoy?rutina_id → 200 { cumplimiento, ejercicios: [{ ejercicio_id, series_objetivo, series[] }] }
  @Get('sesiones/hoy')
  @Roles(RolNombre.DEPORTISTA)
  buscarSesionDeHoy(
    @UsuarioActual() usuario: UsuarioToken,
    @Query() query: SesionDeHoyQuery,
  ) {
    return this.queryService.buscarSesionDeHoy(usuario.id, query.rutina_id);
  }

  // GET /api/ejercicios/{id}/ultimas-series → 200 { fecha, series: [{ numero, peso, repeticiones, rir }] }
  @Get('ejercicios/:id/ultimas-series')
  @Roles(RolNombre.DEPORTISTA)
  buscarUltimasSeries(
    @UsuarioActual() usuario: UsuarioToken,
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new UnprocessableEntityException(
            'El ejercicio debe ser un identificador positivo.',
          ),
      }),
    )
    ejercicioId: number,
  ) {
    return this.queryService.buscarUltimasSeries(usuario.id, ejercicioId);
  }

  // GET /api/deportistas/{id}/asistencia?desde&hasta → 200 [{ fecha, rutina, cumplimiento }]
  // US-12: el entrenador sale del token; el vínculo con el deportista lo verifica el QueryService (RN17)
  @Get('deportistas/:id/asistencia')
  @Roles(RolNombre.ENTRENADOR)
  buscarAsistencia(
    @UsuarioActual() usuario: UsuarioToken,
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new UnprocessableEntityException(
            'El deportista debe ser un identificador positivo.',
          ),
      }),
    )
    deportistaId: number,
    @Query() query: SesionesQuery,
  ) {
    return this.queryService.buscarAsistencia(usuario.id, deportistaId, query);
  }
}
