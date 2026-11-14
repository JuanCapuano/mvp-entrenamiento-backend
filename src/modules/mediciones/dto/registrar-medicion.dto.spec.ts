import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistrarMedicionDto } from './registrar-medicion.dto';

// Mismas opciones que el ValidationPipe de main.ts
async function mensajes(cuerpo: object): Promise<string[]> {
  const errores = await validate(
    plainToInstance(RegistrarMedicionDto, cuerpo),
    {
      whitelist: true,
      forbidNonWhitelisted: true,
    },
  );
  return errores.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('RegistrarMedicionDto (POST /api/mediciones)', () => {
  it('acepta peso corporal y altura mayores a 0', async () => {
    expect(await mensajes({ peso_corporal: 78.4, altura: 1.76 })).toEqual([]);
  });

  it.each([0, -5])('rechaza un peso corporal de %p', async (peso_corporal) => {
    expect(await mensajes({ peso_corporal, altura: 1.76 })).toEqual([
      'El peso corporal tiene que ser mayor a 0.',
    ]);
  });

  it.each([0, -1.76])('rechaza una altura de %p', async (altura) => {
    expect(await mensajes({ peso_corporal: 78.4, altura })).toEqual([
      'La altura tiene que ser mayor a 0.',
    ]);
  });

  it('los dos campos son obligatorios', async () => {
    const errores = await mensajes({});
    expect(errores).toContain('El peso corporal tiene que ser mayor a 0.');
    expect(errores).toContain('La altura tiene que ser mayor a 0.');
  });

  it('rechaza una altura cargada en centímetros', async () => {
    expect(await mensajes({ peso_corporal: 78.4, altura: 176 })).toEqual([
      'La altura se carga en metros (por ejemplo, 1.76).',
    ]);
  });

  it('rechaza un peso corporal que no entra en la base', async () => {
    expect(await mensajes({ peso_corporal: 1000, altura: 1.76 })).toEqual([
      'El peso corporal no puede superar los 999,99 kg.',
    ]);
  });

  it('rechaza más de 2 decimales', async () => {
    expect(await mensajes({ peso_corporal: 78.456, altura: 1.76 })).toEqual([
      'El peso corporal (kg) admite hasta 2 decimales.',
    ]);
  });

  it('no acepta la fecha: la pone el servidor', async () => {
    const errores = await mensajes({
      peso_corporal: 78.4,
      altura: 1.76,
      fecha: '2026-10-20',
    });
    expect(errores).toHaveLength(1);
  });
});
