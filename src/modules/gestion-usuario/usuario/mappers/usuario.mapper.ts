import { Usuario } from '../domain/entities/usuario.entity';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { DeportistaResponseDto } from '../dto/deportista-response.dto';

export class UsuarioMapper {
  static aDto(usuario: Usuario): UsuarioResponseDto {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    };
  }

  static aDeportistaDto(deportista: Usuario): DeportistaResponseDto {
    return {
      id: deportista.id,
      nombre: deportista.nombre,
      email: deportista.email,
    };
  }
}


