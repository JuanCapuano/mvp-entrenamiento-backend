import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum GrupoMuscular {
  PIERNA = 'PIERNA',
  PECHO = 'PECHO',
  ESPALDA = 'ESPALDA',
  HOMBRO = 'HOMBRO',
  BRAZO = 'BRAZO',
  CORE = 'CORE',
}

// Segundo nivel: solo lo tienen los grupos que se subdividen (PIERNA, ESPALDA y BRAZO)
export enum Subgrupo {
  CUADRICEPS = 'CUADRICEPS',
  FEMORAL = 'FEMORAL',
  GLUTEO = 'GLUTEO',
  GEMELOS = 'GEMELOS',
  DORSALES = 'DORSALES',
  TRAPECIO = 'TRAPECIO',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
}

// Subgrupos que le corresponden a cada grupo muscular
export const SUBGRUPOS_POR_GRUPO: Partial<Record<GrupoMuscular, Subgrupo[]>> = {
  [GrupoMuscular.PIERNA]: [
    Subgrupo.CUADRICEPS,
    Subgrupo.FEMORAL,
    Subgrupo.GLUTEO,
    Subgrupo.GEMELOS,
  ],
  [GrupoMuscular.ESPALDA]: [Subgrupo.DORSALES, Subgrupo.TRAPECIO],
  [GrupoMuscular.BRAZO]: [Subgrupo.BICEPS, Subgrupo.TRICEPS],
};

@Entity('ejercicio')
export class Ejercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ name: 'grupo_muscular', type: 'enum', enum: GrupoMuscular })
  grupoMuscular: GrupoMuscular;

  @Column({ type: 'enum', enum: Subgrupo, nullable: true })
  subgrupo: Subgrupo | null;
}
