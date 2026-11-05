import { Body, Controller, Post } from '@nestjs/common';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { RegistrarSerieUseCase } from '../use-cases/registrar-serie.use-case';
import { RegistrarSerieDto } from '../../dto/registrar-serie.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly registrarSerie: RegistrarSerieUseCase) {}

  @Post()
  @Roles(RolNombre.DEPORTISTA)
  registrar(
    @UsuarioActual() usuario: UsuarioToken,
    @Body() dto: RegistrarSerieDto,
  ) {
    return this.registrarSerie.execute(usuario.id, dto);
  }
}
