import { DomainException } from '../../../common/exceptions/domain-exceptions';

// Value object: altura del deportista en metros (RN19)
export class Altura {
  private constructor(public readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number): Altura {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      throw new DomainException('La altura tiene que ser mayor a 0.');
    }
    return new Altura(valor);
  }

  // La base devuelve los decimal como texto
  static desdeBase(valor: number | string): Altura {
    return Altura.crear(Number(valor));
  }
}
