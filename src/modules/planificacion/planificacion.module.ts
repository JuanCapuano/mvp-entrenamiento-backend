import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { Ejercicio } from '../catalogo/domain/entities/ejercicio.entity';
import { Usuario } from '../gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanesController } from './application/controllers/planes.controller';
import { PlanesQueryService } from './application/queries/planes.query-service';
import { AsignarPlanUseCase } from './application/use-cases/asignar-plan.use-case';
import { CrearPlanUseCase } from './application/use-cases/crear-plan.use-case';
import { UsuarioModule } from '../gestion-usuario/usuario/usuario.module';
import { Asignacion } from './domain/entities/asignacion.entity';
import { PlanEntrenamiento } from './domain/entities/plan-entrenamiento.entity';
import { Rutina } from './domain/entities/rutina.entity';
import { IPlanRepositoryToken } from './domain/interfaces/plan.repository-interface';
import { VerificadorSuperposicion } from './domain/services/verificador-superposicion.service';
import { Dosificacion } from './domain/value-objects/dosificacion.vo';
import { PlanRepository } from './infraestructure/repositories/plan.repository';
import { PlanVigenteController } from './application/controllers/plan-vigente.controller';

@Module({
  imports: [
    // Dosificacion es un VO que se guarda en su propia tabla
    TypeOrmModule.forFeature([
      PlanEntrenamiento,
      Rutina,
      Dosificacion,
      Asignacion,
    ]),
    // Ejercicio: solo lectura, para mostrar el nombre en el detalle del plan (PlanesQueryService)
    TypeOrmModule.forFeature([Ejercicio, Usuario]),
    CatalogoModule, // IEjercicioRepositoryToken: validar los ejercicios de las dosificaciones
    UsuarioModule, // IUsuarioRepositoryToken: verificar el vínculo al asignar (RN14)
  ],
  controllers: [PlanesController, PlanVigenteController],
  providers: [
    { provide: IPlanRepositoryToken, useClass: PlanRepository },
    CrearPlanUseCase,
    AsignarPlanUseCase,
    VerificadorSuperposicion,
    PlanesQueryService,
  ],
  // Registro usa buscarPlanVigenteDelDeportista y buscarDosificacionesDeRutinaVigente
  exports: [IPlanRepositoryToken],
})
export class PlanificacionModule {}
