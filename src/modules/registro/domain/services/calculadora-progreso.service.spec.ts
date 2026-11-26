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

  describe('1RM estimado con la fórmula de Epley (RN16)', () => {
    it.each([
      [65, 8, 82.3],
      [60, 8, 76],
      [100, 1, 103.3],
      [62.5, 7, 77.1],
      [0, 12, 0],
    ])('%s kg × %s → %s kg', (peso, repeticiones, esperado) => {
      expect(calculadora.rmEstimado(peso, repeticiones)).toBe(esperado);
    });

    it('por fecha toma el mayor 1RM del día, aunque no sea de la serie de más peso', () => {
      // 60 × 12 → 84; 65 × 5 → 75,8
      const [delDia] = calculadora.calcular([
        serie('2026-10-21', 65, 5),
        serie('2026-10-21', 60, 12),
      ]).porFecha;

      expect(delDia.rmEstimado).toBe(84);
      expect(delDia.pesoMaximo).toBe(65);
    });
  });

  describe('récord personal (RN9)', () => {
    it('gana la serie de más peso aunque tenga menos repeticiones', () => {
      const { record } = calculadora.calcular([
        serie('2026-10-14', 60, 20),
        serie('2026-10-21', 62.5, 1),
      ]);

      expect(record).toEqual({
        peso: 62.5,
        repeticiones: 1,
        fecha: '2026-10-21',
      });
    });

    it('a igual peso gana la de más repeticiones', () => {
      const { record } = calculadora.calcular([
        serie('2026-10-14', 60, 10),
        serie('2026-10-21', 60, 8),
      ]);

      expect(record).toEqual({
        peso: 60,
        repeticiones: 10,
        fecha: '2026-10-14',
      });
    });

    it('si la misma marca se repite, el récord conserva la primera fecha en que se logró', () => {
      const { record } = calculadora.calcular([
        serie('2026-10-21', 65, 8),
        serie('2026-10-14', 65, 8),
      ]);

      expect(record?.fecha).toBe('2026-10-14');
    });

    it('con peso corporal (0 kg) el récord es el de más repeticiones', () => {
      const { record } = calculadora.calcular([
        serie('2026-10-14', 0, 12),
        serie('2026-10-21', 0, 15),
      ]);

      expect(record).toEqual({
        peso: 0,
        repeticiones: 15,
        fecha: '2026-10-21',
      });
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

    it('la mejor serie del día sigue RN9: a igual peso, más repeticiones', () => {
      const [delDia] = calculadora.calcular([
        serie('2026-10-21', 62.5, 7),
        serie('2026-10-21', 62.5, 8),
        serie('2026-10-21', 60, 10),
      ]).porFecha;

      expect(delDia.mejorSerie).toEqual({ peso: 62.5, repeticiones: 8 });
      expect(delDia.pesoMaximo).toBe(62.5);
    });

    it('el volumen suma peso × repeticiones de todas las series del día, sin errores de redondeo', () => {
      // 62,5 × 8 + 62,5 × 7 + 42,25 × 3 = 500 + 437,5 + 126,75
      const [delDia] = calculadora.calcular([
        serie('2026-10-21', 62.5, 8),
        serie('2026-10-21', 62.5, 7),
        serie('2026-10-21', 42.25, 3),
      ]).porFecha;

      expect(delDia.volumen).toBe(1064.25);
    });

    it('las series de peso corporal suman 0 kg de volumen', () => {
      const [delDia] = calculadora.calcular([
        serie('2026-10-21', 0, 12),
      ]).porFecha;

      expect(delDia.volumen).toBe(0);
    });

    it('incluye todas las sesiones del ejercicio y las ordena de la más antigua a la más reciente', () => {
      // Las sesiones pueden ser de planes distintos: el progreso sigue al ejercicio
      const { porFecha } = calculadora.calcular([
        serie('2026-11-04', 67.5, 6),
        serie('2026-10-14', 60, 8),
        serie('2026-10-21', 65, 8),
      ]);

      expect(porFecha.map((p) => p.fecha)).toEqual([
        '2026-10-14',
        '2026-10-21',
        '2026-11-04',
      ]);
    });

    it('dos sesiones el mismo día (rutinas distintas) con el ejercicio se juntan en una sola fecha', () => {
      const { porFecha } = calculadora.calcular([
        serie('2026-10-21', 60, 8),
        serie('2026-10-21', 65, 6),
      ]);

      expect(porFecha).toHaveLength(1);
      expect(porFecha[0].volumen).toBe(870);
    });
  });

  it('si nunca hizo el ejercicio no hay récord ni fechas', () => {
    expect(calculadora.calcular([])).toEqual({ record: null, porFecha: [] });
  });
});
