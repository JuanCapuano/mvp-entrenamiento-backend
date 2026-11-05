import { DomainException } from '../../../common/exceptions/domain-exceptions';

export class RIR {
  private constructor(public readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number): RIR {
    if (typeof valor === 'number' && valor < 0) {
      throw new DomainException('El RIR no puede ser negativo.');
    }
    if (!Number.isSafeInteger(valor) || valor < 0) {
      throw new DomainException('El RIR debe ser un entero mayor o igual a 0.');
    }
    return new RIR(valor);
  }

  static desdeBase(valor: number): RIR {
    return RIR.crear(valor);
  }
}
