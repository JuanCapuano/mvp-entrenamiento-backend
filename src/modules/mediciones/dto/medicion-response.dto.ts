// snake_case según la convención del contrato (paso 11)

// POST /api/mediciones
export class MedicionRegistradaResponseDto {
  id: number;
  fecha: string; // YYYY-MM-DD
}

// GET /api/mediciones
export class MedicionResponseDto {
  fecha: string; // YYYY-MM-DD
  peso_corporal: number; // kg
  altura: number; // m
}
