import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUsuarioRepository } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import { IUsuarioRepositoryToken } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import { UsuarioMapper } from '../../../usuario/mappers/usuario.mapper';
import { UsuarioResponseDto } from '../../../usuario/dto/usuario-response.dto';
import { IngresarDto } from '../../dto/ingresar.dto';
import { GeneradorToken } from '../../generador-token';

// US-02: verifica las credenciales → pide el access token al GeneradorToken
@Injectable()
export class IngresarUseCase {
  constructor(
    @Inject(IUsuarioRepositoryToken)
    private readonly usuarioRepository: IUsuarioRepository,

    private readonly generadorToken: GeneradorToken,
  ) {}

  async execute(
    dto: IngresarDto,
  ): Promise<{ access_token: string; usuario: UsuarioResponseDto }> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);

    const contrasenaValida =
      usuario !== null &&
      (await bcrypt.compare(dto.contrasena, usuario.contrasena));

    // Mismo mensaje para email o contraseña: no revela qué emails existen
    if (!usuario || !contrasenaValida) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }

    return {
      access_token: await this.generadorToken.generarToken(usuario),
      usuario: UsuarioMapper.aDto(usuario),
    };
  }
}
