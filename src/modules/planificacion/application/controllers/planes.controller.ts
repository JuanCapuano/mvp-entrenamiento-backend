import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { CrearPlanDto } from '../../dto/crear-plan.dto';
import { PlanesQueryService } from '../queries/planes.query-service';
import { CrearPlanUseCase } from '../use-cases/crear-plan.use-case';

// Rutas según el contrato (Paso 11): /api/planes. Sin lógica: el controlador solo delega.
@Controller('planes')
@Roles(RolNombre.ENTRENADOR)
export class PlanesController {
  constructor(
    private readonly crearPlanUseCase: CrearPlanUseCase,
    private readonly queryService: PlanesQueryService,
  ) {}

  @Post()
  crearPlan(@Body() dto: CrearPlanDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.crearPlanUseCase.execute(usuario.id, dto);
  }

  @Get()
  listarMisPlanes(@UsuarioActual() usuario: UsuarioToken) {
    return this.queryService.listarMisPlanes(usuario.id);
  }

  @Get(':id')
  buscarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.queryService.buscarDetalle(id, usuario.id);
  }
}
