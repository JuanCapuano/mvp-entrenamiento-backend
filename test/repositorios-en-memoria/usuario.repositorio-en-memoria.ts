import { Usuario } from '../../src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { IUsuarioRepository } from '../../src/modules/gestion-usuario/usuario/domain/interfaces/usuario.repository-interface';

// Reemplaza a UsuarioRepository (TypeORM) en los tests de los use cases: implementa la misma
// interfaz, pero guarda en un Map en lugar de MySQL.
// Guarda y devuelve copias, igual que la base: un cambio en la entidad solo queda guardado
// si el use case llama a guardar().
export class UsuarioRepositorioEnMemoria implements IUsuarioRepository {
  private readonly usuarios = new Map<number, Usuario>();

  constructor(usuariosIniciales: Usuario[] = []) {
    usuariosIniciales.forEach((usuario) =>
      this.usuarios.set(usuario.id, copiar(usuario)),
    );
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    const usuario = this.usuarios.get(id);
    return Promise.resolve(usuario ? copiar(usuario) : null);
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = [...this.usuarios.values()].find((u) => u.email === email);
    return Promise.resolve(usuario ? copiar(usuario) : null);
  }

  guardar(usuario: Usuario): Promise<Usuario> {
    this.usuarios.set(usuario.id, copiar(usuario));
    return Promise.resolve(usuario);
  }
}

function copiar(usuario: Usuario): Usuario {
  return Object.assign(new Usuario(), usuario);
}
