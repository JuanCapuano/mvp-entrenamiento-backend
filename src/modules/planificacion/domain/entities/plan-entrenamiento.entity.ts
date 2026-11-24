import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Dosificacion } from '../value-objects/dosificacion.vo';
import { Vigencia } from '../value-objects/vigencia.vo';
import { Asignacion } from './asignacion.entity';
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

  // Cada deportista que sigue el plan, con sus fechas. Se guardan con el plan (cascade).
  @OneToMany(() => Asignacion, (asignacion) => asignacion.plan, {
    cascade: true,
  })
  asignaciones: Asignacion[];

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
    // El orden de las rutinas es el orden en que llegan (1..n); lo decide la raíz
    rutinas.forEach((rutina, indice) => {
      rutina.orden = indice + 1;
    });
    plan.rutinas = rutinas;
    plan.asignaciones = [];
    return plan;
  }

  // Siempre en el orden definido, sin depender de cómo las cargue la base
  rutinasOrdenadas(): Rutina[] {
    return [...this.rutinas].sort((a, b) => a.orden - b.orden);
  }

  // US-15 (RN3): solo se registran series de ejercicios que pertenecen a una rutina del plan.
  // Con este método el plan cumple PlanVigenteParaRegistro, el contrato que usa registro.
  contieneEjercicio(rutinaId: number, ejercicioId: number): boolean {
    return (this.dosificacionesDeRutina(rutinaId) ?? []).some(
      (d) => d.ejercicioId === ejercicioId,
    );
  }

  // US-16: lo que la rutina le pide al deportista hoy, en orden. null si la rutina no es del plan.
  dosificacionesDeRutina(rutinaId: number): Dosificacion[] | null {
    const rutina = (this.rutinas ?? []).find((r) => r.id === rutinaId);
    return rutina ? rutina.dosificacionesOrdenadas() : null;
  }

  // US-08: el plan se asigna a un deportista con su vigencia. Un mismo plan puede tener varias
  // asignaciones, aunque otros deportistas ya lo estén haciendo. Que la vigencia no se superponga
  // con otras del deportista (RN11) lo verifica antes el VerificadorSuperposicion.
  agregarAsignacion(deportistaId: number, vigencia: Vigencia): Asignacion {
    const asignacion = Asignacion.crear(deportistaId, vigencia);
    this.asignaciones = [...(this.asignaciones ?? []), asignacion];
    return asignacion;
  }
}
