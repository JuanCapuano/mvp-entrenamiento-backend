import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Rutina } from './rutina.entity';

// Raíz del agregado: las rutinas y sus dosificaciones se guardan con ella (cascade).
// Todo cambio entra por acá.
@Entity('plan_entrenamiento')
export class PlanEntrenamiento {
  @PrimaryGeneratedColumn()
  id: number;

  // Referencia al usuario (otro contexto) por id
  @Column({ name: 'entrenador_id', type: 'int' })
  entrenadorId: number;

  @Column()
  nombre: string;

  // Pautas generales; no se registran ni se calculan. Opcionales.
  @Column({ type: 'text', nullable: true })
  indicaciones: string | null;

  @OneToMany(() => Rutina, (rutina) => rutina.plan, { cascade: true })
  rutinas: Rutina[];

  // RN10: todo plan tiene nombre y al menos una rutina (que a su vez tiene dosificaciones)
  static crear(
    entrenadorId: number,
    nombre: string,
    indicaciones: string | null,
    rutinas: Rutina[],
  ): PlanEntrenamiento {
    if (!nombre || nombre.trim() === '') {
      throw new DomainException('El plan tiene que tener un nombre.');
    }
    if (rutinas.length === 0) {
      throw new DomainException('El plan tiene que tener al menos una rutina.');
    }

    const plan = new PlanEntrenamiento();
    plan.entrenadorId = entrenadorId;
    plan.nombre = nombre.trim();
    plan.indicaciones = indicaciones?.trim() ? indicaciones.trim() : null;
    plan.rutinas = rutinas;
    return plan;
  }
}
