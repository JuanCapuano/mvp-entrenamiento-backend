import { Controller, Get, Query } from '@nestjs/common';
import { EjerciciosQueryService } from '../queries/ejercicios.query-service';
import { EjerciciosQuery } from '../queries/ejercicios.query';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';

// Sin use cases: el catálogo no tiene comandos, solo consultas
@Controller('ejercicios')
export class EjerciciosController {
  constructor(private readonly queryService: EjerciciosQueryService) {}

  @Get()
  @Roles(RolNombre.ENTRENADOR)
  listarEjercicios(@Query() query: EjerciciosQuery) {
    return this.queryService.listarEjercicios(query);
  }
}
