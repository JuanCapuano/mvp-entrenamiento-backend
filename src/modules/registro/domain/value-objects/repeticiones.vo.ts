import { DomainException } from '../../../common/exceptions/domain-exceptions';

export class Repeticiones {
  private constructor(public readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number): Repeticiones {
    if (!Number.isSafeInteger(valor) || valor <= 0) {
      throw new DomainException('Las repeticiones tienen que ser mayores a 0.');
    }
    return new Repeticiones(valor);
  }

  static desdeBase(valor: number): Repeticiones {
    return Repeticiones.crear(valor);
  }
}
