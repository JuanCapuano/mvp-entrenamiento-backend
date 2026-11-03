import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PesoCorporal } from '../value-objects/peso-corporal.vo';
import { Altura } from '../value-objects/altura.vo';

@Entity('medicion_corporal')
export class MedicionCorporal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'deportista_id', type: 'int' })
  deportistaId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ name: 'peso_corporal', type: 'decimal', precision: 5, scale: 2 })
  pesoCorporal: number;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  altura: number;

  static crear(
    deportistaId: number,
    fecha: string,
    peso: PesoCorporal,
    altura: Altura,
  ): MedicionCorporal {
    const medicion = new MedicionCorporal();
    medicion.deportistaId = deportistaId;
    medicion.fecha = fecha;
    medicion.pesoCorporal = peso.getValor();
    medicion.altura = altura.getValor();
    return medicion;
  }

  // RN19: Si se carga otra el mismo día, reemplaza a la anterior
  actualizar(peso: PesoCorporal, altura: Altura): void {
    this.pesoCorporal = peso.getValor();
    this.altura = altura.getValor();
  }
}
