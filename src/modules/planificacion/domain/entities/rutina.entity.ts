import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { PlanEntrenamiento } from './plan-entrenamiento.entity';

// Entidad interna del agregado PlanEntrenamiento: se guarda junto con su raíz (cascade)
@Entity('rutina')
export class Rutina {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToOne(() => PlanEntrenamiento, (plan) => plan.rutinas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanEntrenamiento;

  @OneToMany(() => Dosificacion, (dosificacion) => dosificacion.rutina, {
    cascade: true,
  })
  dosificaciones: Dosificacion[];

  // RN10: al menos una dosificación. RN15: un ejercicio no se repite dentro de la rutina.
  static crear(nombre: string, dosificaciones: Dosificacion[]): Rutina {
    if (!nombre || nombre.trim() === '') {
      throw new DomainException('La rutina tiene que tener un nombre.');
    }
    if (dosificaciones.length === 0) {
      throw new DomainException(
        'La rutina tiene que tener al menos un ejercicio.',
      );
    }

    const ejercicios = new Set(dosificaciones.map((d) => d.ejercicioId));
    if (ejercicios.size !== dosificaciones.length) {
      throw new DomainException(
        'El ejercicio no puede repetirse dentro de la rutina.',
      );
    }

    // El orden tiene que ser 1, 2, 3… sin huecos ni repetidos (el array puede venir desordenado)
    const ordenadas = [...dosificaciones].sort((a, b) => a.orden - b.orden);
    if (ordenadas.some((d, indice) => d.orden !== indice + 1)) {
      throw new DomainException(
        'El orden de los ejercicios tiene que ser correlativo, empezando en 1.',
      );
    }

    const rutina = new Rutina();
    rutina.nombre = nombre.trim();
    rutina.dosificaciones = ordenadas;
    return rutina;
  }
}
