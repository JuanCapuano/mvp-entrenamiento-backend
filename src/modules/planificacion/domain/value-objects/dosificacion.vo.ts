import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Rutina } from '../entities/rutina.entity';
import { RangoRepeticiones } from './rango-repeticiones.vo';

// Value object en el modelo, pero se guarda en su propia tabla por ser una lista dentro de Rutina.
// Se reemplaza entera, nunca se edita campo por campo (RN15).
@Entity('dosificacion')
export class Dosificacion {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @ManyToOne(() => Rutina, (rutina) => rutina.dosificaciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rutina_id' })
  readonly rutina: Rutina;

  // Referencia al catálogo por id, no por relación (otro contexto)
  @Column({ name: 'ejercicio_id', type: 'int' })
  readonly ejercicioId: number;

  @Column({ type: 'int' })
  readonly orden: number;

  @Column({ name: 'series_objetivo', type: 'int' })
  readonly seriesObjetivo: number;

  @Column(() => RangoRepeticiones, { prefix: false })
  readonly rangoRepeticiones: RangoRepeticiones;

  @Column({ name: 'rir_objetivo', type: 'int' })
  readonly rirObjetivo: number;

  static crear(
    ejercicioId: number,
    orden: number,
    seriesObjetivo: number,
    rangoRepeticiones: RangoRepeticiones,
    rirObjetivo: number,
  ): Dosificacion {
    if (!Number.isInteger(seriesObjetivo) || seriesObjetivo < 1) {
      throw new DomainException('Las series objetivo tienen que ser 1 o más.');
    }
    if (!Number.isInteger(rirObjetivo) || rirObjetivo < 0) {
      throw new DomainException('El RIR objetivo no puede ser negativo.');
    }
    if (!Number.isInteger(orden) || orden < 1) {
      throw new DomainException(
        'El orden de los ejercicios tiene que ser correlativo, empezando en 1.',
      );
    }

    const dosificacion = new Dosificacion();
    Object.assign(dosificacion, {
      ejercicioId,
      orden,
      seriesObjetivo,
      rangoRepeticiones,
      rirObjetivo,
    });
    return dosificacion;
  }
}
