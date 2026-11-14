import { MedicionCorporal } from '../../src/modules/mediciones/domain/entities/medicion-corporal.entity';
import { IMedicionRepository } from '../../src/modules/mediciones/domain/interfaces/medicion.repository-interface';

// Misma interfaz que el repositorio real, para probar los use cases sin base.
// Guarda y devuelve copias, igual que la base: un cambio en la entidad solo queda guardado
// si el use case llama a guardar().
export class MedicionRepositoryEnMemoria implements IMedicionRepository {
  private readonly guardadas = new Map<number, MedicionCorporal>();
  private siguienteId = 1;

  constructor(medicionesIniciales: MedicionCorporal[] = []) {
    medicionesIniciales.forEach((medicion) => {
      const copia = copiar(medicion);
      copia.id ??= this.siguienteId;
      this.siguienteId = Math.max(this.siguienteId, copia.id + 1);
      this.guardadas.set(copia.id, copia);
    });
  }

  get mediciones(): MedicionCorporal[] {
    return [...this.guardadas.values()].map(copiar);
  }

  buscarDelDia(
    deportistaId: number,
    fecha: string,
  ): Promise<MedicionCorporal | null> {
    const medicion = [...this.guardadas.values()].find(
      (m) => m.deportistaId === deportistaId && m.fecha === fecha,
    );
    return Promise.resolve(medicion ? copiar(medicion) : null);
  }

  guardar(medicion: MedicionCorporal): Promise<MedicionCorporal> {
    medicion.id ??= this.siguienteId++;
    this.guardadas.set(medicion.id, copiar(medicion));
    return Promise.resolve(medicion);
  }
}

function copiar(medicion: MedicionCorporal): MedicionCorporal {
  return Object.assign(new MedicionCorporal(), medicion);
}
