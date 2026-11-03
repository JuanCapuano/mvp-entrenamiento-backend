import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicionCorporal } from './domain/entities/medicion-corporal.entity';
import { IMedicionRepositoryToken } from './domain/interfaces/medicion.repository-interface';
import { MedicionRepository } from './infraestructure/repositories/medicion.repository';
import { RegistrarMedicionUseCase } from './application/use-cases/registrar-medicion.use-case';
import { MedicionesQueryService } from './application/queries/mediciones.query-service';
import { MedicionesController } from './application/controllers/mediciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicionCorporal])],
  controllers: [MedicionesController],
  providers: [
    MedicionRepository,
    {
      provide: IMedicionRepositoryToken,
      useExisting: MedicionRepository,
    },
    RegistrarMedicionUseCase,
    MedicionesQueryService,
  ],
  exports: [IMedicionRepositoryToken, MedicionesQueryService],
})
export class MedicionesModule {}
