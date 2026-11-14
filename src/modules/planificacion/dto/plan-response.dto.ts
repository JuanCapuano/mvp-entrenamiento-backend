// snake_case según la convención del contrato (paso 11)

// POST /api/planes
export class PlanCreadoResponseDto {
  id: number;
}

// POST /api/planes/{id}/asignaciones
export class AsignacionResponseDto {
  plan_id: number;
  deportista_id: number;
  vigencia_desde: string;
  vigencia_hasta: string;
}

// GET /api/planes
export class PlanResumenResponseDto {
  id: number;
  nombre: string;
  rutinas: string[];
}

export class DosificacionResponseDto {
  ejercicio_id: number;
  ejercicio_nombre: string | null; // del catálogo, solo para mostrar
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
