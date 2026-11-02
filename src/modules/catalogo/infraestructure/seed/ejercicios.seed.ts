import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Ejercicio,
  GrupoMuscular,
} from '../../domain/entities/ejercicio.entity';

const MMII = [
  // Cuádriceps
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
  // Femoral
  'Femoral tumbado',
  'Femoral de pie',
  'Femoral en prensa',
  'Peso muerto',
  // Glúteo
  'Hip thrust con barra',
  'Hip thrust en máquina Smith',
  'Sentadilla hack invertida',
  'Patada en polea baja',
  // Gemelos
  'Elevación de talones en prensa',
  'Costurera',
  'Elevación de talones en máquina',
  'Elevación de talones con barra',
];

const MMSS = [
  // Bíceps
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
  // Espalda: dorsales
  'Remo con barra',
  'Remo sentado',
  'Remo en máquina',
  // Espalda: trapecio
  'Encogimientos con barra',
  'Encogimientos con mancuerna',
  'Remo al cuello con polea baja',
  'Remo al cuello con barra',
  'Polea al pecho',
  'Polea tras nuca',
  'Dominada tras nuca',
  'Dominada al frente',
  // Tríceps
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
  // Pecho
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
  // Hombro
  'Press militar tras nuca',
  'Press militar con barra',
  'Press militar con mancuerna',
  'Elevaciones laterales espalda recta',
  'Elevaciones laterales sentado tronco inclinado',
  'Elevaciones laterales por encima de la cabeza',
  'Elevaciones frontales con mancuerna',
  'Elevaciones frontales con barra',
  'Elevaciones frontales con polea baja',
];

const EJERCICIOS: Pick<Ejercicio, 'nombre' | 'grupoMuscular'>[] = [
  ...MMII.map((nombre) => ({ nombre, grupoMuscular: GrupoMuscular.MMII })),
  ...MMSS.map((nombre) => ({ nombre, grupoMuscular: GrupoMuscular.MMSS })),
];

// Carga los ejercicios precargados al iniciar la app; solo inserta los que faltan
@Injectable()
export class EjerciciosSeed implements OnModuleInit {
  private readonly logger = new Logger(EjerciciosSeed.name);

  constructor(
    @InjectRepository(Ejercicio)
    private readonly repository: Repository<Ejercicio>,
  ) {}

  async onModuleInit() {
    for (const ejercicio of EJERCICIOS) {
      const existe = await this.repository.exists({
        where: { nombre: ejercicio.nombre },
      });
      if (!existe) {
        await this.repository.save(this.repository.create(ejercicio));
        this.logger.log(`Ejercicio precargado: ${ejercicio.nombre}`);
      }
    }
  }
}
