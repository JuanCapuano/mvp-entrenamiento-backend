import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './application/controllers/auth.controller';
import { CrearCuentaUseCase } from './application/use-cases/crear-cuenta.use-case';
import { IngresarUseCase } from './application/use-cases/ingresar.use-case';
import { AuthGuard } from './auth.guard';
import { GeneradorToken } from './generador-token';
import { UsuarioModule } from '../usuario/usuario.module';
import { RolModule } from '../rol/rol.module';

@Module({
  imports: [
    // Sin secret por defecto: GeneradorToken y AuthGuard indican JWT_SECRET al firmar y verificar
    JwtModule.register({}),
    UsuarioModule,
    RolModule,
  ],
  controllers: [AuthController],
  providers: [
    CrearCuentaUseCase,
    IngresarUseCase,
    GeneradorToken,
    // Guard global: protege todas las rutas de la app salvo las @Public()
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
