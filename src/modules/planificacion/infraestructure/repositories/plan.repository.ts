import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntrenamiento } from '../../domain/entities/plan-entrenamiento.entity';
import { IPlanRepository } from '../../domain/interfaces/plan.repository-interface';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly repository: Repository<PlanEntrenamiento>,
  ) {}

  // Las rutinas y dosificaciones se guardan con el plan (cascade), en una sola operación
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento> {
    return this.repository.save(plan);
  }
  async buscarPorId(id: number): Promise<PlanEntrenamiento | null> {
    return this.repository.findOne({
      where: { id },
      relations: { rutinas: { dosificaciones: true } },
      order: { rutinas: { orden: 'ASC', dosificaciones: { orden: 'ASC' } } },
    });
  }
}
