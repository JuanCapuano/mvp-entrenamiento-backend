import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from '../../../rol/domain/entities/rol.entity';
import { RolNombre } from '../../../rol/domain/enums/rol-nombre.enum';
import {DomainException} from '../../../../common/exceptions/domain-exceptions';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  // Hash de bcrypt; nunca sale en las respuestas porque el mapper no lo copia
  @Column()
  contrasena: string;

  @ManyToOne(() => Rol, { nullable: false })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ name: 'rol_id', type: 'int' })
  rolId: number;

  // auditoría
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({name: 'entrenador_id', type: 'int', nullable: true})
  entrenadorId: number | null;

  // RN18: el entrenador vincula a un deportista; un deportista tiene un solo entrenador
vincularA(entrenadorId: number): void {
  if (this.rol.nombre !== RolNombre.DEPORTISTA) {
    throw new DomainException('El email no corresponde a una cuenta de deportista.');
  }
  if (this.entrenadorId === entrenadorId) {
    throw new DomainException(`${this.nombre} ya está vinculado con vos.`);
  }
  if (this.entrenadorId !== null) {
    throw new DomainException(`${this.nombre} ya tiene entrenador.`);
  }
  this.entrenadorId = entrenadorId;
}

}
