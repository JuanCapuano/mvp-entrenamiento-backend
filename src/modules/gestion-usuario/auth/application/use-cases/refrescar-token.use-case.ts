import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { IUsuarioRepository } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import { IUsuarioRepositoryToken } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import { RefrescarTokenDto } from '../../dto/refrescar-token.dto';
import { GeneradorToken } from '../../generador-token';
import { JwtPayload } from '../../jwt-payload.interface';

// Verifica el refresh token → busca el usuario → pide tokens nuevos al GeneradorToken
@Injectable()
export class RefrescarTokenUseCase {
  constructor(
    @Inject(IUsuarioRepositoryToken)
    private readonly usuarioRepository: IUsuarioRepository,

    private readonly generadorToken: GeneradorToken,
  ) {}

  async execute(
    dto: RefrescarTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.generadorToken.verificarRefreshToken(
        dto.refresh_token,
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido o vencido.');
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);

    // Mismo mensaje que un token inválido: no revela si el usuario existe
    if (!usuario) {
      throw new UnauthorizedException('Refresh token inválido o vencido.');
    }

    return this.generadorToken.generarTokens(usuario);
  }
}
