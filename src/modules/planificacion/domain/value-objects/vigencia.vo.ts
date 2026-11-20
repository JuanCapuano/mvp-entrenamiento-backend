import { Column } from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(fecha: string): boolean {
  if (!FORMATO_FECHA.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const real = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    real.getUTCFullYear() === anio &&
    real.getUTCMonth() === mes - 1 &&
    real.getUTCDate() === dia
  );
}

// Value object: período en el que un deportista sigue un plan (RN10). Se guarda embebido en
// la asignación. Las fechas son 'YYYY-MM-DD', así que comparar como texto equivale a comparar fechas.
export class Vigencia {
  @Column({ name: 'vigencia_desde', type: 'date' })
  readonly desde: string;

  @Column({ name: 'vigencia_hasta', type: 'date' })
  readonly hasta: string;

  // RN10: desde ≤ hasta
  static crear(desde: string, hasta: string): Vigencia {
    if (!esFechaValida(desde) || !esFechaValida(hasta)) {
      throw new DomainException(
        'Las fechas de la vigencia tienen que tener el formato AAAA-MM-DD.',
      );
    }
    if (desde > hasta) {
      throw new DomainException(
        'La fecha de inicio no puede ser posterior a la de fin.',
      );
    }

    const vigencia = new Vigencia();
    Object.assign(vigencia, { desde, hasta });
    return vigencia;
  }

  // RN11: los extremos cuentan (si una termina el 30/11 y la otra empieza el 30/11, se superponen)
  seSuperponeCon(otra: Vigencia): boolean {
    return this.desde <= otra.hasta && otra.desde <= this.hasta;
  }

  contiene(fecha: string): boolean {
    return this.desde <= fecha && fecha <= this.hasta;
  }
}
