import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Ejercicio,
  GrupoMuscular,
  Subgrupo,
} from '../../domain/entities/ejercicio.entity';

type EjercicioSeed = Pick<Ejercicio, 'nombre' | 'grupoMuscular' | 'subgrupo'>;

// Arma los ejercicios de un grupo (y subgrupo, si lo tiene) a partir de sus nombres
const de = (
  grupoMuscular: GrupoMuscular,
  subgrupo: Subgrupo | null,
  nombres: string[],
): EjercicioSeed[] =>
  nombres.map((nombre) => ({ nombre, grupoMuscular, subgrupo }));

const EJERCICIOS: EjercicioSeed[] = [
  // ---- Pierna ----
  ...de(GrupoMuscular.PIERNA, Subgrupo.CUADRICEPS, [
    'Sentadilla con barra',
    'Sentadilla con mancuerna',
    'Extensión de pierna en máquina',
    'Desplantes al frente con barra',
    'Desplantes al frente con mancuerna',
    'Desplantes laterales con barra',
    'Abductores en máquina',
    'Sentadilla hack',
    'Tijeras',
    'Prensa',
  ]),
  ...de(GrupoMuscular.PIERNA, Subgrupo.FEMORAL, [
    'Femoral tumbado',
    'Femoral de pie',
    'Femoral en prensa',
    'Peso muerto',
  ]),
  ...de(GrupoMuscular.PIERNA, Subgrupo.GLUTEO, [
    'Hip thrust con barra',
    'Hip thrust en máquina Smith',
    'Sentadilla hack invertida',
    'Patada en polea baja',
  ]),
  ...de(GrupoMuscular.PIERNA, Subgrupo.GEMELOS, [
    'Elevación de talones en prensa',
    'Costurera',
    'Elevación de talones en máquina',
    'Elevación de talones con barra',
  ]),

  // ---- Espalda ----
  ...de(GrupoMuscular.ESPALDA, Subgrupo.DORSALES, [
    'Remo con barra',
    'Remo sentado',
    'Remo en máquina',
  ]),
  ...de(GrupoMuscular.ESPALDA, Subgrupo.TRAPECIO, [
    'Encogimientos con barra',
    'Encogimientos con mancuerna',
    'Remo al cuello con polea baja',
    'Remo al cuello con barra',
    'Polea al pecho',
    'Polea tras nuca',
    'Dominada tras nuca',
    'Dominada al frente',
  ]),

  // ---- Pecho ----
  ...de(GrupoMuscular.PECHO, null, [
    'Press banca inclinada con barra',
    'Press banca declinada con barra',
    'Press banca plana con barra',
    'Press banca inclinada con mancuerna',
    'Press banca declinada con mancuerna',
    'Press banca plana con mancuerna',
    'Aperturas con mancuerna (flies)',
    'Aperturas con polea alta',
    'Aperturas con máquina (pec fly)',
    'Pull over con mancuerna a dos manos',
  ]),

  // ---- Hombro ----
  ...de(GrupoMuscular.HOMBRO, null, [
    'Press militar tras nuca',
    'Press militar con barra',
    'Press militar con mancuerna',
    'Elevaciones laterales espalda recta',
    'Elevaciones laterales sentado tronco inclinado',
    'Elevaciones laterales por encima de la cabeza',
    'Elevaciones frontales con mancuerna',
    'Elevaciones frontales con barra',
    'Elevaciones frontales con polea baja',
  ]),

  // ---- Core ----
  ...de(GrupoMuscular.CORE, null, [
    'Plancha',
    'Plancha lateral',
    'Crunch abdominal',
    'Crunch en polea alta',
    'Elevación de piernas colgado',
    'Elevación de piernas en banca',
    'Rueda abdominal',
    'Giro ruso con mancuerna',
    'Rotación de tronco en polea',
    'Bicicleta abdominal',
  ]),

  // ---- Brazo ----
  ...de(GrupoMuscular.BRAZO, Subgrupo.BICEPS, [
    'Curl con barra',
    'Curl con barra agarre prono',
    'Curl con barra Z',
    'Curl con mancuerna en banca inclinada',
    'Curl concentrado con mancuerna',
    'Curl concentrado en polea baja',
    'Curl con polea baja agarre prono',
    'Curl con polea baja agarre supino',
    'Curl en banco Scott con barra Z',
    'Brazos en cruz en polea alta',
    'Curl tipo martillo',
    'Dominadas agarre estrecho posición prono',
  ]),
  ...de(GrupoMuscular.BRAZO, Subgrupo.TRICEPS, [
    'Fondos en banca plana',
    'Fondos en barras paralelas',
    'Press francés en banca plana con barra',
    'Press francés en banca plana con mancuerna',
    'Press francés sentado',
    'Extensión de antebrazo con tronco inclinado',
    'Extensión de antebrazo en banca plana',
    'Copas a dos manos',
    'Copas a una mano',
    'Extensión de tríceps en polea alta agarre prono',
    'Extensión de tríceps en polea alta agarre supino',
    'Extensión de tríceps en polea alta con cable',
    'Extensión de tríceps en polea alta tras nuca',
  ]),
];

// Carga los ejercicios precargados al iniciar la app. Los que no existen se insertan y,
// si ya existen (se identifican por nombre), se actualizan su grupo y subgrupo.
@Injectable()
export class EjerciciosSeed implements OnModuleInit {
  private readonly logger = new Logger(EjerciciosSeed.name);

  constructor(
    @InjectRepository(Ejercicio)
    private readonly repository: Repository<Ejercicio>,
  ) {}

  async onModuleInit() {
    for (const ejercicio of EJERCICIOS) {
      const existente = await this.repository.findOne({
        where: { nombre: ejercicio.nombre },
      });
      if (!existente) {
        await this.repository.save(this.repository.create(ejercicio));
        this.logger.log(`Ejercicio precargado: ${ejercicio.nombre}`);
      } else if (
        existente.grupoMuscular !== ejercicio.grupoMuscular ||
        existente.subgrupo !== ejercicio.subgrupo
      ) {
        existente.grupoMuscular = ejercicio.grupoMuscular;
        existente.subgrupo = ejercicio.subgrupo;
        await this.repository.save(existente);
        this.logger.log(`Ejercicio reclasificado: ${ejercicio.nombre}`);
      }
    }
  }
}
