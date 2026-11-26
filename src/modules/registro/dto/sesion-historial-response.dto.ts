// GET /api/sesiones?desde&hasta (US-20). snake_case según la convención del contrato (Paso 11)

export class SerieHistorialResponseDto {
  numero: number;
  peso: number; // kg; 0 = peso corporal
  repeticiones: number;
  rir: number;
}

export class EjercicioHistorialResponseDto {
  nombre: string;
  cumplimiento: number; // % entero, máximo 100
  series: SerieHistorialResponseDto[]; // en orden de número
}

// Una sesión del listado
export class SesionHistorialResponseDto {
  fecha: string; // 'YYYY-MM-DD'
  rutina: string; // nombre de la rutina
  cumplimiento: number; // % entero, máximo 100, calculado igual que en la sesión de hoy
  ejercicios: EjercicioHistorialResponseDto[]; // en el orden de la rutina
}
