import { RolNombre } from '../../rol/domain/enums/rol-nombre.enum';

export class UsuarioResponseDto {
  id: number;
  nombre: string;
  email: string;
  rol: RolNombre;
}
