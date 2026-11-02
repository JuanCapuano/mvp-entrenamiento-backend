import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { IUsuarioRepository } from '../../domain/interfaces/usuario.repository-interface';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
  ) {}

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { id },
      relations: { rol: true },
    });
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { email },
      relations: { rol: true },
    });
  }

  guardar(usuario: Usuario): Promise<Usuario> {
    return this.repository.save(usuario);
  }
}
