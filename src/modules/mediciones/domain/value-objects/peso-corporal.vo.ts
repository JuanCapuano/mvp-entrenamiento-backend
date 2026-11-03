import { DomainException } from '../../../common/exceptions/domain-exceptions';

// RN19: El peso corporal tiene que ser mayor a 0 (> 0), en kg, hasta 2 decimales
export class PesoCorporal {
  private readonly valor: number;

  constructor(valor: number) {
    if (typeof valor !== 'number' || isNaN(valor) || valor <= 0) {
      throw new DomainException('El peso corporal tiene que ser mayor a 0.');
    }
    this.valor = Math.round(valor * 100) / 100;
  }

  getValor(): number {
    return this.valor;
  }
}
