import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CrearCuentaUseCase } from '../use-cases/crear-cuenta.use-case';
import { IngresarUseCase } from '../use-cases/ingresar.use-case';
import { RefrescarTokenUseCase } from '../use-cases/refrescar-token.use-case';
import { CrearCuentaDto } from '../../dto/crear-cuenta.dto';
import { IngresarDto } from '../../dto/ingresar.dto';
import { RefrescarTokenDto } from '../../dto/refrescar-token.dto';
import { Public } from '../../public.decorator';

// Rutas según el contrato (Paso 11): POST /api/auth/register, /api/auth/login y /api/auth/refresh
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly crearCuentaUseCase: CrearCuentaUseCase,
    private readonly ingresarUseCase: IngresarUseCase,
    private readonly refrescarTokenUseCase: RefrescarTokenUseCase,
  ) {}

  @Post('register')
  crearCuenta(@Body() dto: CrearCuentaDto) {
    return this.crearCuentaUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  ingresar(@Body() dto: IngresarDto) {
    return this.ingresarUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refrescarToken(@Body() dto: RefrescarTokenDto) {
    return this.refrescarTokenUseCase.execute(dto);
  }
}
