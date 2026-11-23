import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Ejercicio } from '../../../catalogo/domain/entities/ejercicio.entity';
import { PlanEntrenamiento } from '../../domain/entities/plan-entrenamiento.entity';
import {
  PlanDetalleResponseDto,
  PlanResumenResponseDto,
} from '../../dto/plan-response.dto';
import { PlanMapper } from '../../mappers/plan.mapper';
import { fechaActual } from '../../../common/helpers/fecha-actual.helper';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanVigenteResponseDto } from '../../dto/plan-response.dto';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class PlanesQueryService {
  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly repository: Repository<PlanEntrenamiento>,

    // Solo lectura de una tabla de otro módulo (catálogo): permitido en un QueryService.
    // Nunca se escribe en ella.
    @InjectRepository(Ejercicio)
    private readonly ejercicios: Repository<Ejercicio>,

    // Solo lectura de una tabla de otro módulo (usuario): permitido en un QueryService
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,

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

    const nombresEjercicios = await this.buscarNombresEjercicios(plan);

    return PlanMapper.aDetalleDto(plan, nombresEjercicios);
  }

    // US13, plan vigente del deportista del token
  async buscarPlanVigente(deportistaId: number): Promise<PlanVigenteResponseDto> {
    const hoy = fechaActual();

    const plan = await this.repository.findOne({
      where: {
        asignaciones: {
          deportistaId,
          vigencia: { desde: LessThanOrEqual(hoy), hasta: MoreThanOrEqual(hoy) },
        },
      },
      relations: { asignaciones: true, rutinas: { dosificaciones: true } },
      order: { rutinas: { orden: 'ASC', dosificaciones: { orden: 'ASC' } } },
    });

    if (!plan) {
      // confirmar en el paso 11 si es 404 o 200 vacío, y el mensaje textual
      throw new NotFoundException('No tenés un plan vigente.');
    }

    const nombres = await this.buscarNombresEjercicios(plan);
    const entrenador = await this.usuarios.findOne({
      select: { id: true, nombre: true },
      where: { id: plan.entrenadorId },
    });

    return PlanMapper.aVigenteDto(
      plan,
      plan.asignaciones[0],
      entrenador?.nombre ?? null,
      nombres,
    );
  }

  // Nombre de cada ejercicio de las dosificaciones, en una sola consulta (ejercicioId → nombre)
  private async buscarNombresEjercicios(
    plan: PlanEntrenamiento,
  ): Promise<Map<number, string>> {
    const ids = [
      ...new Set(
        plan.rutinas.flatMap((r) => r.dosificaciones.map((d) => d.ejercicioId)),
      ),
    ];
    if (ids.length === 0) return new Map();

    const ejercicios = await this.ejercicios.find({
      select: { id: true, nombre: true },
      where: { id: In(ids) },
    });

    return new Map(ejercicios.map((e) => [e.id, e.nombre]));
  }
}
