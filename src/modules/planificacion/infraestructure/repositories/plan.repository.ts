import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  // PENDIENTE (US-08 asignar plan / US-13 plan vigente): todavía no hay asignaciones, así que
  // hoy ningún deportista tiene plan vigente. Cuando existan, estas dos consultas tienen que
  // buscar la asignación cuya vigencia contiene la fecha.

  // US-15 (RN3): mientras tanto, registrar una serie responde "No tenés un plan vigente."
  async buscarPlanVigenteDelDeportista(
    _deportistaId: number,
    _fecha: string,
  ): Promise<PlanVigenteParaRegistro | null> {
    return null;
  }

  // US-16: mientras tanto, la sesión de hoy responde 403 "La rutina no es de tu plan vigente."
  async buscarDosificacionesDeRutinaVigente(
    _deportistaId: number,
    _rutinaId: number,
    _fecha: string,
  ): Promise<DosificacionParaRegistro[] | null> {
    return null;
  }
}
