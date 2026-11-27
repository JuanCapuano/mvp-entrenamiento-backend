import { CalculadoraResumen } from './calculadora-resumen.service';
import type { SerieDelResumen } from './calculadora-resumen.service';

const HOY = '2026-10-21'; // miércoles: la semana va del lunes 19 al domingo 25/10

// Qué serie fue récord lo decide DetectorRecordPersonal: acá llega ya marcado
const serie = (
  sesionId: number,
  fecha: string,
  peso: number,
  repeticiones: number,
  record = false,
): SerieDelResumen => ({ sesionId, fecha, peso, repeticiones, record });

describe('CalculadoraResumen (resumen de la semana)', () => {
  const calculadora = new CalculadoraResumen();

  describe('Paso 10: hoy es miércoles 21/10', () => {
    // 14/10: Piernas, Sentadilla 60 × 8 (×3). 21/10: Piernas, Sentadilla 65 × 8 (récord) y Torso, Press 50 × 10
    const resumen = calculadora.resumir(
      [
        serie(1, '2026-10-14', 60, 8),
        serie(1, '2026-10-14', 60, 8),
        serie(1, '2026-10-14', 60, 8),
        serie(2, HOY, 65, 8, true),
        serie(3, HOY, 50, 10),
      ],
      HOY,
    );

    it('la semana va del lunes 19/10 al domingo 25/10', () => {
      expect(resumen.desde).toBe('2026-10-19');
      expect(resumen.hasta).toBe('2026-10-25');
    });

    it('cuenta el récord de esta semana', () => {
      expect(resumen.records).toBe(1);
    });

    it('volumen de la semana: 65 × 8 + 50 × 10 = 1020 kg; la anterior, 3 × 60 × 8 = 1440 kg', () => {
      expect(resumen.volumen).toBe(1020);
      expect(resumen.volumenAnterior).toBe(1440);
    });

    it('esta semana: 2 sesiones (Piernas y Torso) y 2 series', () => {
      expect(resumen.sesiones).toBe(2);
      expect(resumen.series).toBe(2);
    });
  });

  it('un récord de una semana anterior no cuenta en esta', () => {
    const resumen = calculadora.resumir(
      [serie(1, '2026-10-14', 65, 8, true), serie(2, HOY, 60, 8)],
      HOY,
    );

    expect(resumen.records).toBe(0);
  });

  it('el domingo todavía es parte de la semana que empezó el lunes', () => {
    const resumen = calculadora.resumir(
      [serie(1, '2026-10-19', 60, 8)],
      '2026-10-25',
    );

    expect(resumen.desde).toBe('2026-10-19');
    expect(resumen.series).toBe(1);
  });

  it('sin series: todo en 0', () => {
    expect(calculadora.resumir([], HOY)).toEqual({
      desde: '2026-10-19',
      hasta: '2026-10-25',
      records: 0,
      volumen: 0,
      volumenAnterior: 0,
      sesiones: 0,
      series: 0,
    });
  });

  it('redondea el volumen a 2 decimales', () => {
    const resumen = calculadora.resumir(
      [serie(1, '2026-10-20', 0.1, 3), serie(1, '2026-10-20', 0.2, 3)],
      HOY,
    );

    expect(resumen.volumen).toBe(0.9);
  });
});
