import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../usuario/domain/entities/usuario.entity';
import { JwtPayload } from './jwt-payload.interface';

// Firma el access token con el id y el rol del usuario.
// Lo usa IngresarUseCase; cualquier otro caso que necesite emitir un token llama a esta clase.
@Injectable()
export class GeneradorToken {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generarToken(usuario: Usuario): Promise<string> {
    const payload: JwtPayload = { sub: usuario.id, rol: usuario.rol.nombre };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION', '1d'),
    });
  }
}
