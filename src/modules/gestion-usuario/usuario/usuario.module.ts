import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './domain/entities/usuario.entity';
import { UsuarioController } from './application/controllers/usuario.controller';
import { UsuarioQueryService } from './application/queries/usuario.query-service';
import { UsuarioRepository } from './infraestructure/repositories/usuario.repository';
import { IUsuarioRepositoryToken } from './domain/interfaces/usuario.repository-interface';
import { DeportistasController } from './application/controllers/deportista.controller';
import { DeportistaUseCase } from './application/uses-cases/deportista.use-case';


@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuarioController, DeportistasController],
  providers: [
    UsuarioQueryService,
    DeportistaUseCase,
    { provide: IUsuarioRepositoryToken, useClass: UsuarioRepository},
  ],
  // Los use cases de auth usan buscarPorEmail y guardar
  exports: [IUsuarioRepositoryToken],
})
export class UsuarioModule {}
