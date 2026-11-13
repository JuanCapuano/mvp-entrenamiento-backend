import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../../../auth/roles.decorator';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import {
  UsuarioActual,
  type UsuarioToken,
} from '../../../auth/usuario-actual.decorator';
import { DeportistaUseCase } from '../uses-cases/deportista.use-case';
import { DeportistaDto } from '../../dto/deportista.dto';
import { UsuarioQueryService } from '../queries/usuario.query-service';

// Endpoints del entrenador sobre sus deportistas (US-03, US-04)
@Controller('deportistas')
@Roles(RolNombre.ENTRENADOR)
export class DeportistasController {
  constructor(
    private readonly deportistaUseCase: DeportistaUseCase,
    private readonly usuarioQueryService: UsuarioQueryService,
  ) {}

  // GET /api/deportistas → 200 [{ id, nombre, email }]
  @Get()
  listar(@UsuarioActual() entrenador: UsuarioToken) {
    return this.usuarioQueryService.listarDeportistas(entrenador.id);
  }

  // POST /api/deportistas → 201 { id, nombre, email }
  @Post()
  vincular(
    @UsuarioActual() entrenador: UsuarioToken,
    @Body() dto: DeportistaDto,
  ) {
    return this.deportistaUseCase.execute(entrenador.id, dto);
  }
}
