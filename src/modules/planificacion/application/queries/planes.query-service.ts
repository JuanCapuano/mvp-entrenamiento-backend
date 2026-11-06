import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntrenamiento } from '../../domain/entities/plan-entrenamiento.entity';
import {
  PlanDetalleResponseDto,
  PlanResumenResponseDto,
} from '../../dto/plan-response.dto';
import { PlanMapper } from '../../mappers/plan.mapper';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class PlanesQueryService {
  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly repository: Repository<PlanEntrenamiento>,
  ) {}

  // CU16: solo los planes del entrenador del token
  async listarMisPlanes(
    entrenadorId: number,
  ): Promise<PlanResumenResponseDto[]> {
    const planes = await this.repository.find({
      where: { entrenadorId },
      relations: { rutinas: true },
      order: { id: 'ASC', rutinas: { id: 'ASC' } },
    });

    return planes.map((plan) => PlanMapper.aResumenDto(plan));
  }

  // CU22: 404 si no existe; 403 si es de otro entrenador (RN17)
  async buscarDetalle(
    id: number,
    entrenadorId: number,
  ): Promise<PlanDetalleResponseDto> {
    const plan = await this.repository.findOne({
      where: { id },
      relations: { rutinas: { dosificaciones: true } },
      order: { rutinas: { id: 'ASC', dosificaciones: { orden: 'ASC' } } },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado.');
    }
    if (plan.entrenadorId !== entrenadorId) {
      throw new ForbiddenException('No tenés permisos para ver este plan.');
    }

    return PlanMapper.aDetalleDto(plan);
  }
}
