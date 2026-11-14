import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Vigencia } from '../value-objects/vigencia.vo';

// '2026-11-30' → '30/11'
function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
}

// Servicio de dominio puro (RN11): un deportista no puede tener dos asignaciones con vigencias
// superpuestas, aunque sean de planes distintos. Recibe las vigencias ya cargadas; no consulta nada.
@Injectable()
export class VerificadorSuperposicion {
  verificar(nueva: Vigencia, existentes: Vigencia[]): void {
    const conflicto = existentes.find((vigencia) =>
      vigencia.seSuperponeCon(nueva),
    );
    if (conflicto) {
      throw new DomainException(
        `Se superpone con el plan vigente (${diaMes(conflicto.desde)} al ${diaMes(conflicto.hasta)}).`,
      );
    }
  }
}
