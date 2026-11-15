// snake_case según la convención del contrato (paso 11)

export class SerieDeHoyResponseDto {
  id: number; // para corregirla con PATCH /api/series/{id} (US-17)
  numero: number;
  peso: number; // kg; 0 = peso corporal
  repeticiones: number;
  rir: number;
}

export class EjercicioDeHoyResponseDto {
  ejercicio_id: number;
  series_objetivo: number;
  series: SerieDeHoyResponseDto[]; // todas las registradas, aunque superen las pedidas
}

// GET /api/sesiones/hoy?rutina_id
export class SesionDeHoyResponseDto {
  cumplimiento: number; // % entero, máximo 100
  ejercicios: EjercicioDeHoyResponseDto[]; // en el orden de la rutina
}
