import { Column } from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';

// Value object: rango de repeticiones prescripto (RN15). Se guarda embebido en la dosificación.
export class RangoRepeticiones {
  @Column({ name: 'reps_min', type: 'int' })
  readonly minimo: number;

  @Column({ name: 'reps_max', type: 'int' })
  readonly maximo: number;

  static crear(minimo: number, maximo: number): RangoRepeticiones {
    if (!Number.isInteger(minimo) || !Number.isInteger(maximo) || minimo < 1) {
      throw new DomainException('Las repeticiones tienen que ser mayores a 0.');
    }
    if (minimo > maximo) {
      throw new DomainException(
        'Las repeticiones mínimas no pueden ser mayores a las máximas.',
      );
    }

    const rango = new RangoRepeticiones();
    Object.assign(rango, { minimo, maximo });
    return rango;
  }
}
