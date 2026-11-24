import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Asignacion } from '../../domain/entities/asignacion.entity';
import { PlanEntrenamiento } from '../../domain/entities/plan-entrenamiento.entity';
import type {
  DosificacionParaRegistro,
  IPlanRepository,
  PlanVigenteParaRegistro,
} from '../../domain/interfaces/plan.repository-interface';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly repository: Repository<PlanEntrenamiento>,
    @InjectRepository(Asignacion)
    private readonly asignaciones: Repository<Asignacion>,
  ) {}

  // Devuelve el plan con sus rutinas (ordenadas) y sus asignaciones cargadas
  buscarPorId(id: number): Promise<PlanEntrenamiento | null> {
    return this.repository.findOne({
      where: { id },
      relations: { rutinas: { dosificaciones: true }, asignaciones: true },
      order: { rutinas: { orden: 'ASC', dosificaciones: { orden: 'ASC' } } },
    });
  }

  buscarAsignacionesDelDeportista(deportistaId: number): Promise<Asignacion[]> {
    return this.asignaciones.find({ where: { deportistaId } });
  }

  // Las rutinas y dosificaciones se guardan con el plan (cascade), en una sola operación
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento> {
    return this.repository.save(plan);
  }

  // --- Lo que usa el módulo registro ---
  // US-15 (RN3): plan cuya asignación al deportista contiene la fecha (desde <= fecha <= hasta),
  // con el mismo criterio que PlanesQueryService.buscarPlanVigente.
  // RN11: las vigencias no se superponen, así que hay como mucho uno (findOne).
  // RN12: la fecha la pone el servidor (el use case pasa fechaActual()), nunca el cliente.
  // RN17: se filtra por el deportista del token; nunca se busca el plan de otro.
  buscarPlanVigenteDelDeportista(
    deportistaId: number,
    fecha: string,
  ): Promise<PlanVigenteParaRegistro | null> {
    return this.buscarPlanVigente(deportistaId, fecha);
  }

  // US-16: dosificaciones de la rutina pedida, solo si es del plan vigente del deportista.
  // null si no tiene plan vigente o la rutina es de otro plan (403 en SesionesQueryService).
  // RN11, RN12 y RN17: los mismos que buscarPlanVigenteDelDeportista, que es quien busca el plan.
  async buscarDosificacionesDeRutinaVigente(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ): Promise<DosificacionParaRegistro[] | null> {
    const plan = await this.buscarPlanVigente(deportistaId, fecha);
    return plan?.dosificacionesDeRutina(rutinaId) ?? null;
  }

  // Consulta compartida por los dos métodos de arriba (vigencia con extremos incluidos)
  private buscarPlanVigente(
    deportistaId: number,
    fecha: string,
  ): Promise<PlanEntrenamiento | null> {
    return this.repository.findOne({
      where: {
        asignaciones: {
          deportistaId,
          vigencia: {
            desde: LessThanOrEqual(fecha),
            hasta: MoreThanOrEqual(fecha),
          },
        },
      },
      relations: { rutinas: { dosificaciones: true } },
    });
  }
}
