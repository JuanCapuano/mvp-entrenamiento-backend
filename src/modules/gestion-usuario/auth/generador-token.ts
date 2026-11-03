import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../usuario/domain/entities/usuario.entity';
import { JwtPayload } from './jwt-payload.interface';

// Firma el access token y el refresh token con el id y el rol del usuario, y verifica el refresh.
// Lo usan IngresarUseCase y RefrescarTokenUseCase; cualquier otro caso que necesite emitir un token llama a esta clase.
// Access y refresh se firman con secrets distintos: el AuthGuard (JWT_SECRET) rechaza un refresh usado como access.
@Injectable()
export class GeneradorToken {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generarTokens(
    usuario: Usuario,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = { sub: usuario.id, rol: usuario.rol.nombre };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  // Lanza si el token es inválido, está vencido o fue firmado con otro secret
  verificarRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
