import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { SesionEntrenamientoFactory } from '../factories/sesion-entrenamiento.factory';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';

// Datos del Paso 10: Juan (3) registró hoy, 21/10, Sentadilla 62,5 kg × 8
const JUAN_ID = 3;
const HOY = '2026-10-21';
const SENTADILLA = 1;
const PESO_MUERTO = 2;

const valores = (peso: number, repeticiones: number, rir: number) =>
  [Peso.crear(peso), Repeticiones.crear(repeticiones), RIR.crear(rir)] as const;

// Sesión de hoy con dos series de Sentadilla y una de Peso muerto, con los ids que pondría la base
function sesionDeHoy() {
  const sesion = new SesionEntrenamientoFactory().crear(
    JUAN_ID,
    1,
    1,
    HOY,
    SENTADILLA,
    ...valores(62.5, 8, 2),
  );
  sesion.registrarSerie(JUAN_ID, HOY, SENTADILLA, ...valores(62.5, 7, 1));
  sesion.registrarSerie(JUAN_ID, HOY, PESO_MUERTO, ...valores(50, 10, 2));
  sesion.series.forEach((serie, indice) =>
    Object.assign(serie, { id: indice + 11 }),
  );
  return sesion;
}

describe('SesionEntrenamiento.corregirSerie (US-17, RN1, RN8)', () => {
  it('E6: cambia el peso, las repeticiones y el RIR de la serie', () => {
    const sesion = sesionDeHoy();

    const corregida = sesion.corregirSerie(
      JUAN_ID,
      HOY,
      11,
      ...valores(65, 8, 1),
    );

    expect(corregida.peso.valor).toBe(65);
    expect(corregida.repeticiones.valor).toBe(8);
    expect(corregida.rir.valor).toBe(1);
    expect(sesion.series.find((serie) => serie.id === 11)).toBe(corregida);
  });

  it.each(['2026-10-22'])(
    'E7: no se puede corregir si hoy (%s) no es el día de la sesión',
    (otroDia) => {
      const sesion = sesionDeHoy();

      expect(() =>
        sesion.corregirSerie(JUAN_ID, otroDia, 11, ...valores(65, 8, 1)),
      ).toThrow(new DomainException('Solo se puede corregir el mismo día.'));
      expect(sesion.series.find((serie) => serie.id === 11)?.peso.valor).toBe(
        62.5,
      );
    },
  );

  it('rechaza una serie que no es de esta sesión', () => {
    const sesion = sesionDeHoy();

    expect(() =>
      sesion.corregirSerie(JUAN_ID, HOY, 99, ...valores(65, 8, 1)),
    ).toThrow(new DomainException('La serie no pertenece a esta sesión.'));
  });

  it('los valores corregidos cumplen las mismas condiciones que al registrar (RN4, RN5, RN6)', () => {
    expect(() => valores(65, 0, 1)).toThrow(
      'Las repeticiones tienen que ser mayores a 0.',
    );
    expect(() => valores(-5, 8, 1)).toThrow('El peso no puede ser negativo.');
    expect(() => valores(65, 8, -1)).toThrow('El RIR no puede ser negativo.');
  });
});
