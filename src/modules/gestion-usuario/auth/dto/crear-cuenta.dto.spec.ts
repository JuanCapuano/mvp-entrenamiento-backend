import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearCuentaDto } from './crear-cuenta.dto';

// Validaciones de formato de POST /api/auth/register (el ValidationPipe responde 422)
async function errores(cuerpo: object): Promise<string[]> {
  const resultado = await validate(plainToInstance(CrearCuentaDto, cuerpo));
  return resultado.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('CrearCuentaDto (US-01)', () => {
  const valido = {
    nombre: 'Juan Pérez',
    email: 'juan@mail.com',
    contrasena: 'demo1234',
    rol: 'DEPORTISTA',
  };

  it.each([
    [{ nombre: '   ' }, 'El nombre es obligatorio.'],
    [{ email: 'juan.mail.com' }, 'El email no tiene un formato válido.'],
    [
      { contrasena: 'abc123' },
      'La contraseña debe tener al menos 8 caracteres.',
    ],
    [
      { contrasena: 'soloLetras' },
      'La contraseña debe tener al menos una letra y un número.',
    ],
    [{ rol: 'ADMIN' }, 'El rol debe ser ENTRENADOR o DEPORTISTA.'],
  ])('rechaza %j con "%s"', async (cambio, mensaje) => {
    expect(await errores({ ...valido, ...cambio })).toContain(mensaje);
  });
});
