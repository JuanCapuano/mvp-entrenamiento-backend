import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { RegistrarMedicionUseCase } from '../use-cases/registrar-medicion.use-case';
import { MedicionesQueryService } from '../queries/mediciones.query-service';
import { RegistrarMedicionDto } from '../../dto/registrar-medicion.dto';
import { MedicionesQuery } from '../queries/mediciones.query';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';

// Contrato Paso 11: POST /api/mediciones (201), GET /api/mediciones (200)
@Controller('mediciones')
export class MedicionesController {
  constructor(
    private readonly registrarMedicionUseCase: RegistrarMedicionUseCase,
    private readonly queryService: MedicionesQueryService,
  ) {}

  // RN17: Solo el deportista registra sus propias mediciones
  @Post()
  @Roles(RolNombre.DEPORTISTA)
  @HttpCode(HttpStatus.CREATED)
  registrar(
    @UsuarioActual() usuario: UsuarioToken,
    @Body() dto: RegistrarMedicionDto,
  ) {
    return this.registrarMedicionUseCase.execute(usuario.id, dto);
  }

  // RN17: El deportista consulta lo suyo; el entrenador consulta de sus deportistas vinculados
  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioToken,
    @Query() query: MedicionesQuery,
  ) {
    let deportistaId = usuario.id;

    if (usuario.rol === RolNombre.ENTRENADOR) {
      if (!query.deportista_id) {
        throw new BadRequestException(
          'El entrenador debe especificar el deportista_id.',
        );
      }
      deportistaId = query.deportista_id;
    }

    return this.queryService.listarMediciones(
      deportistaId,
      query.desde,
      query.hasta,
    );
  }
}
