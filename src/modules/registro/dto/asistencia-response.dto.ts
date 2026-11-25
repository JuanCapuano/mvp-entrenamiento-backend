// snake_case según la convención del contrato (paso 11)

// GET /api/deportistas/{id}/asistencia: una entrada por sesión de entrenamiento.
// RN17: el entrenador ve fecha, rutina y cumplimiento; nunca pesos, repeticiones, RIR ni récords.
export class AsistenciaResponseDto {
  fecha: string; // YYYY-MM-DD
  rutina: string; // nombre de la rutina que hizo ese día
  cumplimiento: number; // % entero, con tope de 100
}
