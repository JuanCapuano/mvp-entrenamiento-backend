import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { fechaActual } from '../../../common/helpers/fecha-actual.helper';
import type { IUsuarioRepository } from '../../../gestion-usuario/usuario/domain/interfaces/usuario.repository-interface';
import { IUsuarioRepositoryToken } from '../../../gestion-usuario/usuario/domain/interfaces/usuario.repository-interface';
import { PlanAsignado } from '../../domain/events/plan-asignado.event';
import type { IPlanRepository } from '../../domain/interfaces/plan.repository-interface';
import { IPlanRepositoryToken } from '../../domain/interfaces/plan.repository-interface';
import { VerificadorSuperposicion } from '../../domain/services/verificador-superposicion.service';
import { Vigencia } from '../../domain/value-objects/vigencia.vo';
import { AsignarPlanDto } from '../../dto/asignar-plan.dto';
import { AsignacionResponseDto } from '../../dto/plan-response.dto';
import { PlanMapper } from '../../mappers/plan.mapper';

// US-08 (CU4): el plan existe y es del entrenador (404/403) → vigencia válida (RN10) →
// el deportista está vinculado (RN14) → no se superpone con otras vigencias (RN11)
// → asignar → guardar → publicar Plan asignado
@Injectable()
export class AsignarPlanUseCase {
  constructor(
    @Inject(IPlanRepositoryToken)
    private readonly planRepository: IPlanRepository,

    @Inject(IUsuarioRepositoryToken)
    private readonly usuarioRepository: IUsuarioRepository,

    private readonly verificadorSuperposicion: VerificadorSuperposicion,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    entrenadorId: number,
    planId: number,
    dto: AsignarPlanDto,
  ): Promise<AsignacionResponseDto> {
    const plan = await this.planRepository.buscarPorId(planId);
    if (!plan) {
      throw new NotFoundException('El plan no existe.');
    }
    // RN17: el plan es de otro entrenador
    if (plan.entrenadorId !== entrenadorId) {
      throw new ForbiddenException('El plan no es tuyo.');
    }

    const vigencia = Vigencia.crear(dto.vigencia_desde, dto.vigencia_hasta);

    const deportista = await this.usuarioRepository.buscarPorId(
      dto.deportista_id,
    );
    if (!deportista) {
      throw new NotFoundException('El deportista no existe.');
    }
    if (!deportista.estaVinculadoCon(entrenadorId)) {
      throw new DomainException('El deportista no está vinculado con vos.');
    }

    const asignacionesDelDeportista =
      await this.planRepository.buscarAsignacionesDelDeportista(deportista.id);
    this.verificadorSuperposicion.verificar(
      vigencia,
      asignacionesDelDeportista.map((asignacion) => asignacion.vigencia),
    );

    const asignacion = plan.agregarAsignacion(deportista.id, vigencia);
    await this.planRepository.guardar(plan);

    this.eventEmitter.emit(
      PlanAsignado.name,
      new PlanAsignado(
        plan.id,
        deportista.id,
        entrenadorId,
        vigencia.desde,
        vigencia.hasta,
        fechaActual(),
      ),
    );

    return PlanMapper.aAsignacionDto(plan.id, asignacion);
  }
}
