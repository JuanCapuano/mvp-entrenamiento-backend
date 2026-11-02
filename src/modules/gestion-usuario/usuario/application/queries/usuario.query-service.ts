import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioResponseDto } from '../../dto/usuario-response.dto';
import { UsuarioMapper } from '../../mappers/usuario.mapper';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class UsuarioQueryService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
  ) {}

  async buscarPerfil(id: number): Promise<UsuarioResponseDto> {
    const usuario = await this.repository.findOne({ 
      where: { id },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return UsuarioMapper.aDto(usuario);
  }
}
