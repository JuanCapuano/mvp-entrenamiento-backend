import { Usuario } from '../entities/usuario.entity';

export const IUsuarioRepositoryToken = 'IUsuarioRepository';

export interface IUsuarioRepository {
  buscarPorId(id: number): Promise<Usuario | null>;

  buscarPorEmail(email: string): Promise<Usuario | null>;

  guardar(usuario: Usuario): Promise<Usuario>;
}
