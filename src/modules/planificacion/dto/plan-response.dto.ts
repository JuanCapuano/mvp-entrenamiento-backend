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
  id: number; // NUEVO: el front lo usa como rutina_id al registrar series
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

// GET /api/plan-vigente
export class PlanVigenteResponseDto {
  id: number;
  nombre: string;
  indicaciones: string | null;
  entrenador_nombre: string | null;
  vigencia: { desde: string; hasta: string };
  rutinas: RutinaResponseDto[];
}