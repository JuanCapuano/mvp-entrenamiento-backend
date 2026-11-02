import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './domain/entities/rol.entity';
import { RolRepository } from './infraestructure/repositories/rol.repository';
import { RolesSeed } from './infraestructure/seed/roles.seed';
import { IRolRepositoryToken } from './domain/interfaces/rol.repository-interface';

@Module({
  imports: [TypeOrmModule.forFeature([Rol])],
  providers: [
    { provide: IRolRepositoryToken, useClass: RolRepository },
    RolesSeed,
  ],
  // CrearCuentaUseCase busca el rol con buscarPorNombre
  exports: [IRolRepositoryToken],
})
export class RolModule {}
