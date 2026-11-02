import { RolNombre } from '../rol/domain/enums/rol-nombre.enum';

export interface JwtPayload {
  sub: number;
  rol: RolNombre;
}
