import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { SesionesQueryService } from '../queries/sesiones.query-service';

// Consultas del registro de entrenamiento (Paso 11). Sin lógica: el controlador solo delega.
// Las rutas no comparten prefijo, así que cada una declara la suya completa.
@Controller()
export class SesionesController {
  constructor(private readonly queryService: SesionesQueryService) {}

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
}
