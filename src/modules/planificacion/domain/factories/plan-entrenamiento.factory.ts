import { PlanEntrenamiento } from '../entities/plan-entrenamiento.entity';
import { Rutina } from '../entities/rutina.entity';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../value-objects/rango-repeticiones.vo';

// Datos de entrada del dominio (el dominio no conoce los DTOs de la API)
export interface DatosDosificacion {
  ejercicioId: number;
  orden: number;
  seriesObjetivo: number;
  repsMin: number;
  repsMax: number;
  rirObjetivo: number;
}

export interface DatosRutina {
  nombre: string;
  dosificaciones: DatosDosificacion[];
}

export interface DatosPlan {
  nombre: string;
  indicaciones?: string | null;
  rutinas: DatosRutina[];
}

// Crea el plan completo con sus rutinas y dosificaciones (RN10, RN15).
// Cada pieza valida lo suyo y lanza DomainException.
export class PlanEntrenamientoFactory {
  static crear(entrenadorId: number, datos: DatosPlan): PlanEntrenamiento {
    const rutinas = datos.rutinas.map((rutina) =>
      Rutina.crear(
        rutina.nombre,
        rutina.dosificaciones.map((d) =>
          Dosificacion.crear(
            d.ejercicioId,
            d.orden,
            d.seriesObjetivo,
            RangoRepeticiones.crear(d.repsMin, d.repsMax),
            d.rirObjetivo,
          ),
        ),
      ),
    );

    return PlanEntrenamiento.crear(
      entrenadorId,
      datos.nombre,
      datos.indicaciones ?? null,
      rutinas,
    );
  }
}
