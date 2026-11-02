import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum GrupoMuscular {
  MMII = 'MMII',
  MMSS = 'MMSS',
  CORE = 'CORE',
}

@Entity('ejercicio')
export class Ejercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ name: 'grupo_muscular', type: 'enum', enum: GrupoMuscular })
  grupoMuscular: GrupoMuscular;
}
