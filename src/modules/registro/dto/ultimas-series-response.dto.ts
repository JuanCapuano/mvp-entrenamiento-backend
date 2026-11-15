// snake_case según la convención del contrato (paso 11)

export class SerieAnteriorResponseDto {
  numero: number;
  peso: number; // kg; 0 = peso corporal
  repeticiones: number;
  rir: number;
}

// GET /api/ejercicios/{id}/ultimas-series
// Si el deportista nunca hizo el ejercicio: fecha null y series [].
export class UltimasSeriesResponseDto {
  fecha: string | null; // YYYY-MM-DD
  series: SerieAnteriorResponseDto[];
}
