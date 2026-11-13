import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { Ejercicio } from '../catalogo/domain/entities/ejercicio.entity';
import { PlanesController } from './application/controllers/planes.controller';
import { PlanesQueryService } from './application/queries/planes.query-service';
import { CrearPlanUseCase } from './application/use-cases/crear-plan.use-case';
import { PlanEntrenamiento } from './domain/entities/plan-entrenamiento.entity';
import { Rutina } from './domain/entities/rutina.entity';
import { IPlanRepositoryToken } from './domain/interfaces/plan.repository-interface';
import { Dosificacion } from './domain/value-objects/dosificacion.vo';
import { PlanRepository } from './infraestructure/repositories/plan.repository';

@Module({
  imports: [
    // Dosificacion es un VO que se guarda en su propia tabla
    TypeOrmModule.forFeature([PlanEntrenamiento, Rutina, Dosificacion]),
    // Ejercicio: solo lectura, para mostrar el nombre en el detalle del plan (PlanesQueryService)
    TypeOrmModule.forFeature([Ejercicio]),
    CatalogoModule, // IEjercicioRepositoryToken: validar los ejercicios de las dosificaciones
  ],
  controllers: [PlanesController],
  providers: [
    { provide: IPlanRepositoryToken, useClass: PlanRepository },
    CrearPlanUseCase,
    PlanesQueryService,
  ],
})
export class PlanificacionModule {}
