import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Altura } from '../value-objects/altura.vo';
import { PesoCorporal } from '../value-objects/peso-corporal.vo';

// Raíz de agregado: peso corporal y altura de un deportista en una fecha.
// RN19: una por día (índice único) y los dos valores mayores a 0 (lo garantizan los VOs).
@Entity('medicion_corporal')
@Index('uq_medicion_deportista_fecha', ['deportistaId', 'fecha'], {
  unique: true,
})
export class MedicionCorporal {
  @PrimaryGeneratedColumn()
  id: number;

  // Referencia al usuario (otro contexto) por id
  @Column({ name: 'deportista_id', type: 'int' })
  deportistaId: number;

  // YYYY-MM-DD; la pone el servidor, nunca el cliente
  @Column({ type: 'date' })
  fecha: string;

  @Column({
    name: 'peso_corporal',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (peso?: PesoCorporal) => peso?.valor,
      from: (peso: string | number | null) =>
        peso === null ? peso : PesoCorporal.desdeBase(peso),
    },
  })
  pesoCorporal: PesoCorporal;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    transformer: {
      to: (altura?: Altura) => altura?.valor,
      from: (altura: string | number | null) =>
        altura === null ? altura : Altura.desdeBase(altura),
    },
  })
  altura: Altura;

  // Medición nueva del día. `hoy` entra por parámetro para que los tests puedan fijarlo.
  static registrar(
    deportistaId: number,
    pesoCorporal: PesoCorporal,
    altura: Altura,
    hoy: string,
  ): MedicionCorporal {
    const medicion = new MedicionCorporal();
    medicion.deportistaId = deportistaId;
    medicion.fecha = hoy;
    medicion.pesoCorporal = pesoCorporal;
    medicion.altura = altura;
    return medicion;
  }

  // US-21: si se carga otra medición el mismo día, reemplaza a la anterior.
  // Los VOs se cambian enteros; el id, el deportista y la fecha no cambian.
  reemplazar(pesoCorporal: PesoCorporal, altura: Altura): void {
    this.pesoCorporal = pesoCorporal;
    this.altura = altura;
  }
}
