import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../gestion-usuario/usuario/domain/entities/usuario.entity';
import { MedicionesController } from './application/controllers/mediciones.controller';
import { MedicionesQueryService } from './application/queries/mediciones.query-service';
import { RegistrarMedicionUseCase } from './application/use-cases/registrar-medicion.use-case';
import { MedicionCorporal } from './domain/entities/medicion-corporal.entity';
import { IMedicionRepositoryToken } from './domain/interfaces/medicion.repository-interface';
import { MedicionRepository } from './infraestructure/repositories/medicion.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicionCorporal]),
    // Usuario: solo lectura, para verificar el vínculo entrenador–deportista (MedicionesQueryService)
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [MedicionesController],
  providers: [
    { provide: IMedicionRepositoryToken, useClass: MedicionRepository },
    RegistrarMedicionUseCase,
    MedicionesQueryService,
  ],
})
export class MedicionesModule {}
