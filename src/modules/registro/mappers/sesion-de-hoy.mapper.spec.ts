import { Serie } from '../domain/entities/serie.entity';
import { Peso } from '../domain/value-objects/peso.vo';
import { Repeticiones } from '../domain/value-objects/repeticiones.vo';
import { RIR } from '../domain/value-objects/rir.vo';
import { SesionDeHoyMapper } from './sesion-de-hoy.mapper';

const SENTADILLA = 1;
const PESO_MUERTO = 2;
const PIERNAS = [
  { ejercicioId: SENTADILLA, orden: 1, seriesObjetivo: 3 },
  { ejercicioId: PESO_MUERTO, orden: 2, seriesObjetivo: 3 },
];

let siguienteId = 1;
const serie = (ejercicioId: number, numero: number, peso = 60) =>
  Object.assign(
    new Serie(
      ejercicioId,
      numero,
      Peso.crear(peso),
      Repeticiones.crear(8),
      RIR.crear(2),
    ),
    { id: siguienteId++ },
  );

describe('SesionDeHoyMapper (US-16)', () => {
  beforeEach(() => {
    siguienteId = 11;
  });

  it('devuelve cada ejercicio de la rutina con sus series objetivo y las series de hoy', () => {
    const dto = SesionDeHoyMapper.aDto(
      PIERNAS,
      [serie(SENTADILLA, 1, 62.5), serie(SENTADILLA, 2, 62.5)],
      33,
    );

    expect(dto).toEqual({
      cumplimiento: 33,
      ejercicios: [
        {
          ejercicio_id: SENTADILLA,
          series_objetivo: 3,
          series: [
            { id: 11, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 },
            { id: 12, numero: 2, peso: 62.5, repeticiones: 8, rir: 2 },
          ],
        },
        { ejercicio_id: PESO_MUERTO, series_objetivo: 3, series: [] },
      ],
    });
  });

  it('sin series registradas, los ejercicios salen igual, con la lista vacía', () => {
    const dto = SesionDeHoyMapper.aDto(PIERNAS, [], 0);

    expect(dto.cumplimiento).toBe(0);
    expect(dto.ejercicios.map((e) => e.series)).toEqual([[], []]);
  });

  it('muestra todas las series registradas, aunque superen las pedidas', () => {
    const dto = SesionDeHoyMapper.aDto(
      PIERNAS,
      [1, 2, 3, 4].map((numero) => serie(SENTADILLA, numero)),
      50,
    );

    expect(dto.ejercicios[0].series_objetivo).toBe(3);
    expect(dto.ejercicios[0].series).toHaveLength(4);
  });

  it('respeta el orden de la rutina aunque las dosificaciones lleguen desordenadas', () => {
    const dto = SesionDeHoyMapper.aDto([PIERNAS[1], PIERNAS[0]], [], 0);

    expect(dto.ejercicios.map((e) => e.ejercicio_id)).toEqual([
      SENTADILLA,
      PESO_MUERTO,
    ]);
  });

  it('ordena las series de cada ejercicio por su número', () => {
    const dto = SesionDeHoyMapper.aDto(
      PIERNAS,
      [serie(SENTADILLA, 2), serie(PESO_MUERTO, 1), serie(SENTADILLA, 1)],
      50,
    );

    expect(dto.ejercicios[0].series.map((s) => s.numero)).toEqual([1, 2]);
    expect(dto.ejercicios[1].series.map((s) => s.numero)).toEqual([1]);
  });
});
