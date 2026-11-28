import * as bcrypt from 'bcrypt';
import { UnprocessableEntityException } from '@nestjs/common';
import { CrearCuentaUseCase } from './crear-cuenta.use-case';
import { UsuarioRepositorioEnMemoria } from '../../../../../../test/repositorios-en-memoria/usuario.repositorio-en-memoria';
import { RolRepositoryEnMemoria } from '../../../../../../test/repositorios-en-memoria/rol.repository-en-memoria';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';

describe('CrearCuentaUseCase (US-01)', () => {
  const dto = {
    nombre: 'Juan Pérez',
    email: 'juan@mail.com',
    contrasena: 'demo1234',
    rol: RolNombre.DEPORTISTA,
  };
  let usuarios: UsuarioRepositorioEnMemoria;
  let caso: CrearCuentaUseCase;

  beforeEach(() => {
    usuarios = new UsuarioRepositorioEnMemoria();
    caso = new CrearCuentaUseCase(usuarios, new RolRepositoryEnMemoria());
  });

  it('crea la cuenta con su rol y responde sin la contraseña', async () => {
    const respuesta = await caso.execute(dto);

    expect(respuesta).toEqual({
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@mail.com',
      rol: RolNombre.DEPORTISTA,
    });
    expect(await usuarios.buscarPorEmail(dto.email)).not.toBeNull();
  });

  it('guarda la contraseña hasheada, nunca en texto plano', async () => {
    await caso.execute(dto);

    const guardado = await usuarios.buscarPorEmail(dto.email);
    expect(guardado!.contrasena).not.toBe(dto.contrasena);
    expect(await bcrypt.compare(dto.contrasena, guardado!.contrasena)).toBe(
      true,
    );
  });

  it('rechaza un email ya registrado (422) y no crea otra cuenta', async () => {
    await caso.execute(dto);
    const guardar = jest.spyOn(usuarios, 'guardar');

    await expect(
      caso.execute({ ...dto, nombre: 'Otro', rol: RolNombre.ENTRENADOR }),
    ).rejects.toThrow(
      new UnprocessableEntityException('El email ya está registrado.'),
    );
    expect(guardar).not.toHaveBeenCalled();
  });
});
