import { Peso } from './peso.vo';
import { Repeticiones } from './repeticiones.vo';

// Lo que se levantó en una serie: peso y repeticiones. Es lo que compara RN9.
// Value object inmutable: dos marcas con el mismo peso y repeticiones son iguales.
export class Marca {
  private constructor(
    public readonly peso: number, // kg; 0 = peso corporal
    public readonly repeticiones: number,
  ) {
    Object.freeze(this);
  }

  // Valida con los VOs de la serie (RN4, RN5): no repite esas reglas
  static crear(peso: number, repeticiones: number): Marca {
    return Marca.desdeSerie(Peso.crear(peso), Repeticiones.crear(repeticiones));
  }

  // Desde los VOs de una Serie, que ya están validados
  static desdeSerie(peso: Peso, repeticiones: Repeticiones): Marca {
    return new Marca(peso.valor, repeticiones.valor);
  }

  // RN9: más peso gana; a igual peso, más repeticiones. Una marca igual no supera.
  // Única definición de la regla: la usan DetectorRecordPersonal (US-18) y CalculadoraProgreso (US-19).
  superaA(otra: Marca): boolean {
    return (
      this.peso > otra.peso ||
      (this.peso === otra.peso && this.repeticiones > otra.repeticiones)
    );
  }
}
