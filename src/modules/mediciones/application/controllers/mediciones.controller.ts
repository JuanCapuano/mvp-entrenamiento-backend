import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../../../gestion-usuario/auth/roles.decorator';
import { UsuarioActual } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { RegistrarMedicionDto } from '../../dto/registrar-medicion.dto';
import { MedicionesQuery } from '../queries/mediciones.query';
import { MedicionesQueryService } from '../queries/mediciones.query-service';
import { RegistrarMedicionUseCase } from '../use-cases/registrar-medicion.use-case';

// Rutas según el contrato (Paso 11): /api/mediciones. Sin lógica: el controlador solo delega.
@Controller('mediciones')
export class MedicionesController {
  constructor(
    private readonly registrarMedicionUseCase: RegistrarMedicionUseCase,
    private readonly queryService: MedicionesQueryService,
  ) {}

  // POST /api/mediciones → 201 { id, fecha }
  @Post()
  @Roles(RolNombre.DEPORTISTA)
  registrarMedicion(
    @UsuarioActual() usuario: UsuarioToken,
    @Body() dto: RegistrarMedicionDto,
  ) {
    return this.registrarMedicionUseCase.execute(usuario.id, dto);
  }

  // GET /api/mediciones → 200 [{ fecha, peso_corporal, altura }]
  // Los dos roles: el deportista ve las suyas y el entrenador, las de un deportista vinculado
  // (lo verifica el QueryService, RN17).
  @Get()
  @Roles(RolNombre.DEPORTISTA, RolNombre.ENTRENADOR)
  listarMediciones(
    @UsuarioActual() usuario: UsuarioToken,
    @Query() query: MedicionesQuery,
  ) {
    return this.queryService.listarMediciones(usuario, query);
  }
}
