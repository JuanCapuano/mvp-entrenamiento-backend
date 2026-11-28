import { CalculadoraProgreso } from './calculadora-progreso.service';
import type { MarcaDeSerie } from './calculadora-progreso.service';

const serie = (
  fecha: string,
  peso: number,
  repeticiones: number,
): MarcaDeSerie => ({ fecha, peso, repeticiones });

describe('CalculadoraProgreso (US-19)', () => {
  const calculadora = new CalculadoraProgreso();

  describe('E8 del Paso 10: Sentadilla 60 × 8 (14/10) y 65 × 8 (21/10)', () => {
    const progreso = calculadora.calcular([
      serie('2026-10-14', 60, 8),
      serie('2026-10-21', 65, 8),
    ]);

    it('el récord personal es 65 kg × 8 del 21/10', () => {
      expect(progreso.record).toEqual({
        peso: 65,
        repeticiones: 8,
        fecha: '2026-10-21',
      });
    });

    it('el 1RM estimado del 21/10 es 82,3 kg (65 × (1 + 8/30))', () => {
      expect(progreso.porFecha[1].rmEstimado).toBe(82.3);
    });
  });

  describe('por fecha: peso máximo, mejor serie y volumen', () => {
    it('resume cada fecha con su peso máximo, su mejor serie y su volumen', () => {
      // Paso 10: el 14/10 Juan hizo Sentadilla 60 × 8, 60 × 8, 60 × 8
      const [delDia] = calculadora.calcular([
        serie('2026-10-14', 60, 8),
        serie('2026-10-14', 60, 8),
        serie('2026-10-14', 60, 8),
      ]).porFecha;

      expect(delDia).toEqual({
        fecha: '2026-10-14',
        pesoMaximo: 60,
        rmEstimado: 76,
        mejorSerie: { peso: 60, repeticiones: 8 },
        volumen: 1440,
      });
    });
  });

  it('si nunca hizo el ejercicio no hay récord ni fechas', () => {
    expect(calculadora.calcular([])).toEqual({ record: null, porFecha: [] });
  });
});
