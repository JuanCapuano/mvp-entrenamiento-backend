import { UsuarioRepositorioEnMemoria } from '../../../../../../test/repositorios-en-memoria/usuario.repositorio-en-memoria';
import { Rol } from '../../../rol/domain/entities/rol.entity';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import { Usuario } from '../../domain/entities/usuario.entity';
import { DeportistaUseCase } from './deportista.use-case';

const LAURA_ID = 1;

function crearDeportista(id: number, nombre: string, email: string): Usuario {
  const usuario = new Usuario();
  usuario.id = id;
  usuario.nombre = nombre;
  usuario.email = email;
  usuario.rol = Object.assign(new Rol(), { nombre: RolNombre.DEPORTISTA });
  usuario.entrenadorId = null;
  return usuario;
}

describe('DeportistaUseCase (US-03)', () => {
  let repositorio: UsuarioRepositorioEnMemoria;
  let useCase: DeportistaUseCase;

  beforeEach(() => {
    repositorio = new UsuarioRepositorioEnMemoria([
      crearDeportista(4, 'Sofía Ruiz', 'sofia@gym.com'),
    ]);
    useCase = new DeportistaUseCase(repositorio);
  });

  it('después de vincular, el deportista queda guardado con el entrenadorId del entrenador', async () => {
    await useCase.execute(LAURA_ID, { email: 'sofia@gym.com' });

    const guardada = await repositorio.buscarPorEmail('sofia@gym.com');
    expect(guardada?.entrenadorId).toBe(LAURA_ID);
  });

  it('devuelve el id, el nombre y el email del deportista', async () => {
    const respuesta = await useCase.execute(LAURA_ID, {
      email: 'sofia@gym.com',
    });

    expect(respuesta).toEqual({
      id: 4,
      nombre: 'Sofía Ruiz',
      email: 'sofia@gym.com',
    });
  });

  it('rechaza un email que no corresponde a ninguna cuenta', async () => {
    await expect(
      useCase.execute(LAURA_ID, { email: 'nadie@gym.com' }),
    ).rejects.toThrow('El email no corresponde a una cuenta de deportista.');
  });
});


