import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vigencia } from '../value-objects/vigencia.vo';
import { PlanEntrenamiento } from './plan-entrenamiento.entity';

// Entidad interna del agregado PlanEntrenamiento: se guarda junto con su raíz (cascade).
// Un plan puede tener muchas asignaciones, cada deportista con sus fechas.
@Entity('asignacion')
export class Asignacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlanEntrenamiento, (plan) => plan.asignaciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanEntrenamiento;

  // Referencia al usuario (otro contexto) por id
  @Column({ name: 'deportista_id', type: 'int' })
  deportistaId: number;

  @Column(() => Vigencia, { prefix: false })
  vigencia: Vigencia;

  static crear(deportistaId: number, vigencia: Vigencia): Asignacion {
    const asignacion = new Asignacion();
    asignacion.deportistaId = deportistaId;
    asignacion.vigencia = vigencia;
    return asignacion;
  }
}
