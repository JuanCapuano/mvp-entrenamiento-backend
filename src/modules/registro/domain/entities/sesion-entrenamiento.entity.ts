import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Serie } from './serie.entity';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';

@Entity('sesion_entrenamiento')
@Index(
  'uq_sesion_deportista_rutina_fecha',
  ['deportistaId', 'rutinaId', 'fecha'],
  { unique: true },
)
export class SesionEntrenamiento {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column({ name: 'deportista_id', type: 'int' })
  readonly deportistaId: number;

  @Column({ name: 'plan_id', type: 'int' })
  readonly planId: number;

  @Column({ name: 'rutina_id', type: 'int' })
  readonly rutinaId: number;

  @Column({ type: 'date' })
  readonly fecha: string;

  @OneToMany(() => Serie, (serie) => serie.sesion, {
    cascade: ['insert', 'update'],
  })
  private seriesRegistradas: Serie[];

  get series(): readonly Serie[] {
    return [...this.seriesRegistradas];
  }

  static iniciar(
    deportistaId: number,
    planId: number,
    rutinaId: number,
    hoy: string,
    ejercicioId: number,
    peso: Peso,
    repeticiones: Repeticiones,
    rir: RIR,
  ): SesionEntrenamiento {
    const sesion = new SesionEntrenamiento();
    Object.assign(sesion, {
      deportistaId,
      planId,
      rutinaId,
      fecha: hoy,
      seriesRegistradas: [],
    });
    sesion.registrarSerie(
      deportistaId,
      hoy,
      ejercicioId,
      peso,
      repeticiones,
      rir,
    );
    return sesion;
  }

  registrarSerie(
    deportistaId: number,
    hoy: string,
    ejercicioId: number,
    peso: Peso,
    repeticiones: Repeticiones,
    rir: RIR,
  ): Serie {
    if (this.deportistaId !== deportistaId) {
      throw new DomainException(
        'Solo el dueño de la sesión puede registrar series.',
      );
    }
    if (this.fecha !== hoy) {
      throw new DomainException(
        'Las series se registran siempre con la fecha del día.',
      );
    }
    const numero =
      this.seriesRegistradas.reduce(
        (maximo, serie) =>
          serie.ejercicioId === ejercicioId
            ? Math.max(maximo, serie.numeroSerie)
            : maximo,
        0,
      ) + 1;
    const serie = new Serie(ejercicioId, numero, peso, repeticiones, rir);
    this.seriesRegistradas.push(serie);
    return serie;
  }
}
