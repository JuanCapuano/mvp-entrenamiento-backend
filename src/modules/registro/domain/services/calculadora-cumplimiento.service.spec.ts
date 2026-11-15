import { CalculadoraCumplimiento } from './calculadora-cumplimiento.service';

// Datos del Paso 10: Piernas = Sentadilla 3 series + Peso muerto rumano 3 series
const SENTADILLA = 1;
const PESO_MUERTO = 2;
const PRESS_BANCA = 4;
const PIERNAS = [
  { ejercicioId: SENTADILLA, seriesObjetivo: 3 },
  { ejercicioId: PESO_MUERTO, seriesObjetivo: 3 },
];

const series = (ejercicioId: number, cantidad: number) =>
  Array.from({ length: cantidad }, () => ({ ejercicioId }));

describe('CalculadoraCumplimiento (US-16)', () => {
  const calculadora = new CalculadoraCumplimiento();

  describe('por ejercicio', () => {
    it.each([
      [0, 3, 0],
      [1, 3, 33],
      [2, 3, 67],
      [3, 3, 100],
      [1, 4, 25],
      [1, 1, 100],
    ])(
      '%i series registradas de %i objetivo → %i %%',
      (registradas, objetivo, esperado) => {
        expect(calculadora.calcularEjercicio(registradas, objetivo)).toBe(
          esperado,
        );
      },
    );

    it('no supera el 100 % aunque se registren series de más', () => {
      expect(calculadora.calcularEjercicio(5, 3)).toBe(100);
    });

    it('sin series objetivo no hay nada que cumplir', () => {
      expect(calculadora.calcularEjercicio(2, 0)).toBe(0);
    });
  });

  describe('de la sesión', () => {
    it('sin series registradas es 0 %', () => {
      expect(calculadora.calcularSesion(PIERNAS, [])).toBe(0);
    });

    it('cuenta las series registradas sobre el total de series objetivo de la rutina', () => {
      // 3 de Sentadilla + 1 de Peso muerto = 4 de 6
      const registradas = [...series(SENTADILLA, 3), ...series(PESO_MUERTO, 1)];

      expect(calculadora.calcularSesion(PIERNAS, registradas)).toBe(67);
    });

    it('con todas las series objetivo de cada ejercicio es 100 %', () => {
      const registradas = [...series(SENTADILLA, 3), ...series(PESO_MUERTO, 3)];

      expect(calculadora.calcularSesion(PIERNAS, registradas)).toBe(100);
    });

    it('no supera el 100 % aunque se registren series de más', () => {
      const registradas = [...series(SENTADILLA, 5), ...series(PESO_MUERTO, 4)];

      expect(calculadora.calcularSesion(PIERNAS, registradas)).toBe(100);
    });

    it('las series de más en un ejercicio no compensan las que faltan en otro', () => {
      // 5 de Sentadilla cuentan como 3; Peso muerto sin hacer: 3 de 6
      expect(calculadora.calcularSesion(PIERNAS, series(SENTADILLA, 5))).toBe(
        50,
      );
    });

    it('las series de un ejercicio que no está en la rutina no cuentan', () => {
      expect(calculadora.calcularSesion(PIERNAS, series(PRESS_BANCA, 3))).toBe(
        0,
      );
    });

    it('pondera por las series objetivo de cada ejercicio', () => {
      const rutina = [
        { ejercicioId: SENTADILLA, seriesObjetivo: 4 },
        { ejercicioId: PESO_MUERTO, seriesObjetivo: 1 },
      ];

      // 1 de 5 series objetivo, aunque sea un ejercicio completo de dos
      expect(calculadora.calcularSesion(rutina, series(PESO_MUERTO, 1))).toBe(
        20,
      );
    });

    it('una rutina sin series objetivo da 0 %', () => {
      expect(calculadora.calcularSesion([], series(SENTADILLA, 2))).toBe(0);
    });
  });
});
