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
import { AsignarPlanDto } from '../../dto/asignar-plan.dto';
import { CrearPlanDto } from '../../dto/crear-plan.dto';
import { PlanesQueryService } from '../queries/planes.query-service';
import { AsignarPlanUseCase } from '../use-cases/asignar-plan.use-case';
import { CrearPlanUseCase } from '../use-cases/crear-plan.use-case';

// Rutas según el contrato (Paso 11): /api/planes. Sin lógica: el controlador solo delega.
@Controller('planes')
@Roles(RolNombre.ENTRENADOR)
export class PlanesController {
  constructor(
    private readonly crearPlanUseCase: CrearPlanUseCase,
    private readonly asignarPlanUseCase: AsignarPlanUseCase,
    private readonly queryService: PlanesQueryService,
  ) {}

  @Post()
  crearPlan(@Body() dto: CrearPlanDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.crearPlanUseCase.execute(usuario.id, dto);
  }

  // US-08: asignar el plan a un deportista vinculado, con su vigencia
  @Post(':id/asignaciones')
  asignarPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarPlanDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.asignarPlanUseCase.execute(usuario.id, id, dto);
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
