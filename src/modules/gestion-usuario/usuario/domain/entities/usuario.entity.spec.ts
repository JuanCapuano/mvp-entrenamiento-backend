import { DomainException } from '../../../../common/exceptions/domain-exceptions';
import { Rol } from '../../../rol/domain/entities/rol.entity';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import { Usuario } from './usuario.entity';

// Datos del Paso 10: Laura y Martín son entrenadores
const LAURA_ID = 1;
const MARTIN_ID = 2;

function crearUsuario(
  nombre: string,
  rol: RolNombre,
  entrenadorId: number | null = null,
): Usuario {
  const usuario = new Usuario();
  usuario.id = 10;
  usuario.nombre = nombre;
  usuario.rol = Object.assign(new Rol(), { nombre: rol });
  usuario.entrenadorId = entrenadorId;
  return usuario;
}

describe('Usuario.vincularA (US-03, RN18)', () => {
  it('vincula a un deportista sin entrenador', () => {
    const sofia = crearUsuario('Sofía Ruiz', RolNombre.DEPORTISTA);

    sofia.vincularA(LAURA_ID);

    expect(sofia.entrenadorId).toBe(LAURA_ID);
  });

  it('rechaza a un usuario que no es deportista', () => {
    const martin = crearUsuario('Martín Díaz', RolNombre.ENTRENADOR);

    expect(() => martin.vincularA(LAURA_ID)).toThrow(DomainException);
    expect(() => martin.vincularA(LAURA_ID)).toThrow(
      'El email no corresponde a una cuenta de deportista.',
    );
    expect(martin.entrenadorId).toBeNull();
  });

  it('rechaza vincular dos veces al mismo deportista', () => {
    const juan = crearUsuario('Juan Pérez', RolNombre.DEPORTISTA, LAURA_ID);

    expect(() => juan.vincularA(LAURA_ID)).toThrow(
      'Juan Pérez ya está vinculado con vos.',
    );
  });

  it('rechaza a un deportista que ya tiene otro entrenador', () => {
    const juan = crearUsuario('Juan Pérez', RolNombre.DEPORTISTA, LAURA_ID);

    expect(() => juan.vincularA(MARTIN_ID)).toThrow(
      'Juan Pérez ya tiene entrenador.',
    );
    expect(juan.entrenadorId).toBe(LAURA_ID);
  });
});
