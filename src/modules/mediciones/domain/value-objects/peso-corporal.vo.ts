import { DomainException } from '../../../common/exceptions/domain-exceptions';

// Value object: peso del deportista en kg (RN19). No confundir con Peso, que es el peso movido en una serie.
export class PesoCorporal {
  private constructor(public readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number): PesoCorporal {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      throw new DomainException('El peso corporal tiene que ser mayor a 0.');
    }
    return new PesoCorporal(valor);
  }

  // La base devuelve los decimal como texto
  static desdeBase(valor: number | string): PesoCorporal {
    return PesoCorporal.crear(Number(valor));
  }
}
