import { ProgresoMapper } from './progreso.mapper';

describe('ProgresoMapper (US-19)', () => {
  it('traduce el progreso al contrato del Paso 11, en snake_case', () => {
    const dto = ProgresoMapper.aDto({
      record: { peso: 65, repeticiones: 8, fecha: '2026-10-21' },
      porFecha: [
        {
          fecha: '2026-10-21',
          pesoMaximo: 65,
          rmEstimado: 82.3,
          mejorSerie: { peso: 65, repeticiones: 8 },
          volumen: 520,
        },
      ],
    });

    expect(dto).toEqual({
      record: { peso: 65, repeticiones: 8, fecha: '2026-10-21' },
      por_fecha: [
        {
          fecha: '2026-10-21',
          peso_maximo: 65,
          rm_estimado: 82.3,
          mejor_serie: { peso: 65, repeticiones: 8 },
          volumen: 520,
        },
      ],
    });
  });

  it('sin historial: record null y por_fecha vacío', () => {
    expect(ProgresoMapper.aDto({ record: null, porFecha: [] })).toEqual({
      record: null,
      por_fecha: [],
    });
  });

  it('traduce el resumen a snake_case sin cambiar los valores', () => {
    const dto = ProgresoMapper.aResumenDto({
      desde: '2026-10-19',
      hasta: '2026-10-25',
      records: 1,
      volumen: 1020,
      volumenAnterior: 1440,
      sesiones: 2,
      series: 4,
    });

    expect(dto).toEqual({
      desde: '2026-10-19',
      hasta: '2026-10-25',
      records: 1,
      volumen: 1020,
      volumen_anterior: 1440,
      sesiones: 2,
      series: 4,
    });
  });
});
