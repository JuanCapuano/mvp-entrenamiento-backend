import { Inject, Injectable } from '@nestjs/common';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository-interface';
import { IUsuarioRepositoryToken } from '../../domain/interfaces/usuario.repository-interface';
import { DomainException } from '../../../../common/exceptions/domain-exceptions';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { DeportistaDto } from '../../dto/deportista.dto';
import { DeportistaResponseDto } from '../../dto/deportista-response.dto';

// US-03: busca al deportista por email → la entidad decide (RN18) → guarda
@Injectable()
export class DeportistaUseCase {
  constructor(
    @Inject(IUsuarioRepositoryToken)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(
    entrenadorId: number,
    dto: DeportistaDto,
  ): Promise<DeportistaResponseDto> {
    const deportista = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (!deportista) {
      throw new DomainException(
        'El email no corresponde a una cuenta de deportista.',
      );
    }

    deportista.vincularA(entrenadorId);
    await this.usuarioRepository.guardar(deportista);

    return UsuarioMapper.aDeportistaDto(deportista);
  }
}