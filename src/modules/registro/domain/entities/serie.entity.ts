import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';
import { SesionEntrenamiento } from './sesion-entrenamiento.entity';

@Entity('serie')
@Index(
  'uq_serie_sesion_ejercicio_numero',
  ['sesionId', 'ejercicioId', 'numeroSerie'],
  { unique: true },
)
export class Serie {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column({ name: 'sesion_id', type: 'int' })
  readonly sesionId: number;

  @ManyToOne(() => SesionEntrenamiento, 'seriesRegistradas', {
    nullable: false,
    onDelete: 'CASCADE',
    // Un guardado concurrente puede haber agregado otras series a la raíz.
    orphanedRowAction: 'disable',
  })
  @JoinColumn({ name: 'sesion_id' })
  readonly sesion: Relation<SesionEntrenamiento>;

  @Column({ name: 'ejercicio_id', type: 'int' })
  readonly ejercicioId: number;

  @Column({ name: 'numero_serie', type: 'int' })
  readonly numeroSerie: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (peso: Peso) => peso.valor,
      from: (peso: string | number) => Peso.desdeBase(peso),
    },
  })
  readonly peso: Peso;

  @Column({
    type: 'int',
    transformer: {
      to: (repeticiones: Repeticiones) => repeticiones.valor,
      from: (repeticiones: number) => Repeticiones.desdeBase(repeticiones),
    },
  })
  readonly repeticiones: Repeticiones;

  @Column({
    type: 'int',
    transformer: {
      to: (rir: RIR) => rir.valor,
      from: (rir: number) => RIR.desdeBase(rir),
    },
  })
  readonly rir: RIR;

  constructor(
    ejercicioId?: number,
    numeroSerie?: number,
    peso?: Peso,
    repeticiones?: Repeticiones,
    rir?: RIR,
  ) {
    // TypeORM invoca el constructor sin argumentos al hidratar.
    if (ejercicioId === undefined) return;
    this.ejercicioId = ejercicioId;
    this.numeroSerie = numeroSerie!;
    this.peso = peso!;
    this.repeticiones = repeticiones!;
    this.rir = rir!;
  }
}
