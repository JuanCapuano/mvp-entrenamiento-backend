import { DomainException } from '../../../common/exceptions/domain-exceptions';
import type { PlanVigenteParaRegistro } from '../../../planificacion/domain/interfaces/plan.repository-interface';

export class VerificadorEjercicioPlanVigente {
  verificar(
    plan: PlanVigenteParaRegistro | null,
    rutinaId: number,
    ejercicioId: number,
  ): PlanVigenteParaRegistro {
    if (!plan) throw new DomainException('No tenés un plan vigente.');
    if (!plan.contieneEjercicio(rutinaId, ejercicioId)) {
      throw new DomainException(
        'El ejercicio no pertenece a esa rutina de tu plan vigente.',
      );
    }
    return plan;
  }
}
