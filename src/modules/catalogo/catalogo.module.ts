import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ejercicio } from './domain/entities/ejercicio.entity';
import { IEjercicioRepositoryToken } from './domain/interfaces/ejercicio.repository-interface';
import { EjercicioRepository } from './infraestructure/repositories/ejercicio.repository';
import { EjerciciosSeed } from './infraestructure/seed/ejercicios.seed';
import { EjerciciosController } from './application/controllers/ejercicios.controller';
import { EjerciciosQueryService } from './application/queries/ejercicios.query-service';

@Module({
  imports: [TypeOrmModule.forFeature([Ejercicio])],
  controllers: [EjerciciosController],
  providers: [
    { provide: IEjercicioRepositoryToken, useClass: EjercicioRepository },
    EjerciciosQueryService,
    EjerciciosSeed,
  ],
  // Planificación y Registro usan buscarPorId y existe
  exports: [IEjercicioRepositoryToken],
})
export class CatalogoModule {}
