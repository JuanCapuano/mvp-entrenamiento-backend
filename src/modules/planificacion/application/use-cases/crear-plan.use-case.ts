import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IEjercicioRepository } from '../../../catalogo/domain/interfaces/ejercicio.repository-interface';
import { IEjercicioRepositoryToken } from '../../../catalogo/domain/interfaces/ejercicio.repository-interface';
import { fechaActual } from '../../../common/helpers/fecha-actual.helper';
import { PlanCreado } from '../../domain/events/plan-creado.event';
import { PlanEntrenamientoFactory } from '../../domain/factories/plan-entrenamiento.factory';
import type { IPlanRepository } from '../../domain/interfaces/plan.repository-interface';
import { IPlanRepositoryToken } from '../../domain/interfaces/plan.repository-interface';
import { CrearPlanDto } from '../../dto/crear-plan.dto';
import { PlanCreadoResponseDto } from '../../dto/plan-response.dto';
import { PlanMapper } from '../../mappers/plan.mapper';

// US-06 (CU3): la Factory arma y valida el plan (422) → los ejercicios existen en el catálogo (404)
// → guardar → publicar Plan creado
@Injectable()
export class CrearPlanUseCase {
  constructor(
    @Inject(IPlanRepositoryToken)
    private readonly planRepository: IPlanRepository,

    @Inject(IEjercicioRepositoryToken)
    private readonly ejercicioRepository: IEjercicioRepository,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    entrenadorId: number,
    dto: CrearPlanDto,
  ): Promise<PlanCreadoResponseDto> {
    const plan = PlanEntrenamientoFactory.crear(entrenadorId, {
      nombre: dto.nombre,
      indicaciones: dto.indicaciones,
      rutinas: dto.rutinas.map((rutina) => ({
        nombre: rutina.nombre,
        dosificaciones: rutina.dosificaciones.map((d) => ({
          ejercicioId: d.ejercicio_id,
          orden: d.orden,
          seriesObjetivo: d.series_objetivo,
          repsMin: d.reps_min,
          repsMax: d.reps_max,
          rirObjetivo: d.rir_objetivo,
        })),
      })),
    });

    const ejercicioIds = new Set(
      plan.rutinas.flatMap((r) => r.dosificaciones.map((d) => d.ejercicioId)),
    );
    for (const ejercicioId of ejercicioIds) {
      if (!(await this.ejercicioRepository.existe(ejercicioId))) {
        throw new NotFoundException(
          `El ejercicio ${ejercicioId} no existe en el catálogo.`,
        );
      }
    }

    const guardado = await this.planRepository.guardar(plan);

    this.eventEmitter.emit(
      PlanCreado.name,
      new PlanCreado(guardado.id, entrenadorId, fechaActual()),
    );

    return PlanMapper.aCreadoDto(guardado);
  }
}
