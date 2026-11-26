import { Module } from '@nestjs/common';
import type { DynamicModule, ModuleMetadata } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fechaActual } from '../common/helpers/fecha-actual.helper';
import { SesionEntrenamiento } from './domain/entities/sesion-entrenamiento.entity';
import { Serie } from './domain/entities/serie.entity';
import { ISesionEntrenamientoRepositoryToken } from './domain/interfaces/sesion-entrenamiento.repository-interface';
import { SesionEntrenamientoRepository } from './infraestructure/repositories/sesion-entrenamiento.repository';
import { SesionEntrenamientoFactory } from './domain/factories/sesion-entrenamiento.factory';
import { DetectorRecordPersonal } from './domain/services/detector-record-personal.service';
import { CalculadoraCumplimiento } from './domain/services/calculadora-cumplimiento.service';
import { VerificadorEjercicioPlanVigente } from './domain/services/verificador-ejercicio-plan-vigente.service';
import {
  RegistrarSerieUseCase,
  FECHA_ACTUAL_REGISTRO,
} from './application/use-cases/registrar-serie.use-case';
import { CorregirSerieUseCase } from './application/use-cases/corregir-serie.use-case';
import { SeriesController } from './application/controllers/series.controller';
import { SesionesController } from './application/controllers/sesiones.controller';
import { SesionesQueryService } from './application/queries/sesiones.query-service';
import { CalculadoraProgreso } from './domain/services/calculadora-progreso.service';
import { ProgresoQueryService } from './application/queries/progreso.query-service';
import { ProgresoController } from './application/controllers/progreso.controller';

@Module({})
export class RegistroModule {
  // Los imports deben exportar IPlanRepository e IPublicadorEventosRegistro.
  // No hay un plan ficticio ni un emisor silencioso como fallback en producción.
  static conDependencias(
    imports: NonNullable<ModuleMetadata['imports']>,
  ): DynamicModule {
    return {
      module: RegistroModule,
      imports: [
        TypeOrmModule.forFeature([SesionEntrenamiento, Serie]),
        ...imports,
      ],
      controllers: [SeriesController, SesionesController, ProgresoController],
      providers: [
        {
          provide: ISesionEntrenamientoRepositoryToken,
          useClass: SesionEntrenamientoRepository,
        },
        { provide: FECHA_ACTUAL_REGISTRO, useValue: fechaActual },
        SesionEntrenamientoFactory,
        DetectorRecordPersonal,
        CalculadoraCumplimiento,
        VerificadorEjercicioPlanVigente,
        RegistrarSerieUseCase,
        CorregirSerieUseCase,
        SesionesQueryService,
        CalculadoraProgreso,
        ProgresoQueryService,
      ],
      exports: [ISesionEntrenamientoRepositoryToken],
    };
  }
}
