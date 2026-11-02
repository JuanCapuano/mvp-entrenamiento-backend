import { Rol } from '../entities/rol.entity';
import { RolNombre } from '../enums/rol-nombre.enum';

export const IRolRepositoryToken = 'IRolRepository';

export interface IRolRepository {
  buscarPorNombre(nombre: RolNombre): Promise<Rol | null>;

  crear(nombre: RolNombre): Promise<Rol>;
}
