import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CrearCuentaUseCase } from '../use-cases/crear-cuenta.use-case';
import { IngresarUseCase } from '../use-cases/ingresar.use-case';
import { CrearCuentaDto } from '../../dto/crear-cuenta.dto';
import { IngresarDto } from '../../dto/ingresar.dto';
import { Public } from '../../public.decorator';

// Rutas según el contrato del PDF: POST /api/auth/register y POST /api/auth/login
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly crearCuentaUseCase: CrearCuentaUseCase,
    private readonly ingresarUseCase: IngresarUseCase,
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
}
