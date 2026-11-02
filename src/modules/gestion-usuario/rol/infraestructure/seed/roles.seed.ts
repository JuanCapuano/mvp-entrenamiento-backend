import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { IRolRepository } from '../../domain/interfaces/rol.repository-interface';
import { IRolRepositoryToken } from '../../domain/interfaces/rol.repository-interface';
import { RolNombre } from '../../domain/enums/rol-nombre.enum';

// Carga los roles fijos (enum RolNombre) al iniciar la app; solo inserta los que faltan
@Injectable()
export class RolesSeed implements OnModuleInit {
  private readonly logger = new Logger(RolesSeed.name);

  constructor(
    @Inject(IRolRepositoryToken)
    private readonly repository: IRolRepository,
  ) {}

  async onModuleInit() {
    for (const nombre of Object.values(RolNombre)) {
      const existe = await this.repository.buscarPorNombre(nombre);
      if (!existe) {
        await this.repository.crear(nombre);
        this.logger.log(`Rol precargado: ${nombre}`);
      }
    }
  }
}
