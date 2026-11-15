import { DomainException } from '../../../common/exceptions/domain-exceptions';

export class Peso {
  private constructor(public readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number): Peso {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      throw new DomainException('El peso debe ser un número finito.');
    }
    if (valor < 0) throw new DomainException('El peso no puede ser negativo.');
    if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-8) {
      throw new DomainException('El peso admite hasta 2 decimales.');
    }
    return new Peso(valor);
  }

  static desdeBase(valor: number | string): Peso {
    return Peso.crear(Number(valor));
  }
}
