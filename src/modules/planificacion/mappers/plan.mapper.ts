import { PlanEntrenamiento } from '../domain/entities/plan-entrenamiento.entity';
import {
  PlanCreadoResponseDto,
  PlanDetalleResponseDto,
  PlanResumenResponseDto,
} from '../dto/plan-response.dto';

export class PlanMapper {
  static aCreadoDto(plan: PlanEntrenamiento): PlanCreadoResponseDto {
    return { id: plan.id };
  }

  static aResumenDto(plan: PlanEntrenamiento): PlanResumenResponseDto {
    return {
      id: plan.id,
      nombre: plan.nombre,
      rutinas: plan.rutinas.map((rutina) => rutina.nombre),
    };
  }

  static aDetalleDto(plan: PlanEntrenamiento): PlanDetalleResponseDto {
    return {
      id: plan.id,
      nombre: plan.nombre,
      indicaciones: plan.indicaciones,
      rutinas: plan.rutinas.map((rutina) => ({
        nombre: rutina.nombre,
        dosificaciones: rutina.dosificaciones.map((d) => ({
          ejercicio_id: d.ejercicioId,
          orden: d.orden,
          series_objetivo: d.seriesObjetivo,
          reps_min: d.rangoRepeticiones.minimo,
          reps_max: d.rangoRepeticiones.maximo,
          rir_objetivo: d.rirObjetivo,
        })),
      })),
    };
  }
}
