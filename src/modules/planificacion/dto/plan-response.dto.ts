// snake_case según la convención del contrato (paso 11)

// POST /api/planes
export class PlanCreadoResponseDto {
  id: number;
}

// GET /api/planes
export class PlanResumenResponseDto {
  id: number;
  nombre: string;
  rutinas: string[];
}

export class DosificacionResponseDto {
  ejercicio_id: number;
  orden: number;
  series_objetivo: number;
  reps_min: number;
  reps_max: number;
  rir_objetivo: number;
}

export class RutinaResponseDto {
  nombre: string;
  dosificaciones: DosificacionResponseDto[];
}

// GET /api/planes/{id}
export class PlanDetalleResponseDto {
  id: number;
  nombre: string;
  indicaciones: string | null;
  rutinas: RutinaResponseDto[];
}
