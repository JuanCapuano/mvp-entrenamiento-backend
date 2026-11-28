import { Rol } from '../../src/modules/gestion-usuario/rol/domain/entities/rol.entity';
import { RolNombre } from '../../src/modules/gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { IRolRepository } from '../../src/modules/gestion-usuario/rol/domain/interfaces/rol.repository-interface';

// Reemplaza a RolRepository (TypeORM) en los tests de los use cases.
// Arranca con los dos roles del seed, igual que la base.
export class RolRepositoryEnMemoria implements IRolRepository {
  private readonly roles: Rol[] = [];

  constructor(nombres: RolNombre[] = Object.values(RolNombre)) {
    nombres.forEach((nombre) => void this.crear(nombre));
  }

  buscarPorNombre(nombre: RolNombre): Promise<Rol | null> {
    return Promise.resolve(this.roles.find((r) => r.nombre === nombre) ?? null);
  }

  crear(nombre: RolNombre): Promise<Rol> {
    const rol = Object.assign(new Rol(), {
      id: this.roles.length + 1,
      nombre,
    });
    this.roles.push(rol);
    return Promise.resolve(rol);
  }
}
