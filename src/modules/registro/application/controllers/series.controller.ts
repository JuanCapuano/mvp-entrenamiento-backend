import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { RegistrarSerieUseCase } from '../use-cases/registrar-serie.use-case';
import { RegistrarSerieDto } from '../../dto/registrar-serie.dto';
import { CorregirSerieUseCase } from '../use-cases/corregir-serie.use-case';
import { CorregirSerieDto } from '../../dto/corregir-serie.dto';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly registrarSerie: RegistrarSerieUseCase,
    private readonly corregirSerie: CorregirSerieUseCase,
  ) {}

  @Post()
  @Roles(RolNombre.DEPORTISTA)
  registrar(
    @UsuarioActual() usuario: UsuarioToken,
    @Body() dto: RegistrarSerieDto,
  ) {
    return this.registrarSerie.execute(usuario.id, dto);
  }

  // PATCH /api/series/{id} → 200 { serie_id, record_personal }
  @Patch(':id')
  @Roles(RolNombre.DEPORTISTA)
  corregir(
    @UsuarioActual() usuario: UsuarioToken,
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new UnprocessableEntityException(
            'La serie debe ser un identificador positivo.',
          ),
      }),
    )
    serieId: number,
    @Body() dto: CorregirSerieDto,
  ) {
    return this.corregirSerie.execute(usuario.id, serieId, dto);
  }
}
