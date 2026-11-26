// snake_case según la convención del contrato (paso 11)

export class MarcaResponseDto {
  peso: number; // kg; 0 = peso corporal
  repeticiones: number;
}

export class RecordPersonalResponseDto extends MarcaResponseDto {
  fecha: string; // YYYY-MM-DD, la primera vez que se logró
}

export class ProgresoPorFechaResponseDto {
  fecha: string; // YYYY-MM-DD
  peso_maximo: number;
  rm_estimado: number; // estimación con Epley (RN16), 1 decimal
  mejor_serie: MarcaResponseDto;
  volumen: number; // kg
}

// GET /api/progreso?ejercicio_id
// Si el deportista nunca hizo el ejercicio: record null y por_fecha [].
export class ProgresoResponseDto {
  record: RecordPersonalResponseDto | null;
  por_fecha: ProgresoPorFechaResponseDto[];
}

// GET /api/progreso/ejercicios (CU23): los ejercicios que el deportista registró alguna vez
export class EjercicioConProgresoResponseDto {
  id: number;
  nombre: string;
}
