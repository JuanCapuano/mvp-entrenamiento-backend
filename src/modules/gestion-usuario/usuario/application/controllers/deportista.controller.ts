import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../../auth/roles.decorator';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import {
  UsuarioActual,
  type UsuarioToken,
} from '../../../auth/usuario-actual.decorator';
import { DeportistaUseCase } from '../uses-cases/deportista.use-case';
import { DeportistaDto } from '../../dto/deportista.dto';

// Endpoints del entrenador sobre sus deportistas (US-03)
@Controller('deportistas')
@Roles(RolNombre.ENTRENADOR)
export class DeportistasController {
  constructor(private readonly deportistaUseCase: DeportistaUseCase) {}

  // POST /api/deportistas → 201 { id, nombre, email }
  @Post()
  vincular(
    @UsuarioActual() entrenador: UsuarioToken,
    @Body() dto: DeportistaDto,
  ) {
    return this.deportistaUseCase.execute(entrenador.id, dto);
  }
}
