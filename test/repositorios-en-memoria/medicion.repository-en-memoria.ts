import { MedicionCorporal } from '../../src/modules/mediciones/domain/entities/medicion-corporal.entity';
import { IMedicionRepository } from '../../src/modules/mediciones/domain/interfaces/medicion.repository-interface';

export class MedicionRepositoryEnMemoria implements IMedicionRepository {
  public items: MedicionCorporal[] = [];
  private idAutoincremental = 1;

  async buscarDelDia(
    deportistaId: number,
    fecha: string,
  ): Promise<MedicionCorporal | null> {
    const encontrada = this.items.find(
      (m) => m.deportistaId === deportistaId && m.fecha === fecha,
    );
    return encontrada ?? null;
  }

  async guardar(medicion: MedicionCorporal): Promise<MedicionCorporal> {
    if (!medicion.id) {
      medicion.id = this.idAutoincremental++;
      this.items.push(medicion);
    } else {
      const index = this.items.findIndex((m) => m.id === medicion.id);
      if (index >= 0) {
        this.items[index] = medicion;
      } else {
        this.items.push(medicion);
      }
    }
    return medicion;
  }

  async buscarPorDeportistaYFechas(
    deportistaId: number,
    desde?: string,
    hasta?: string,
  ): Promise<MedicionCorporal[]> {
    return this.items
      .filter((m) => {
        if (m.deportistaId !== deportistaId) return false;
        if (desde && m.fecha < desde) return false;
        if (hasta && m.fecha > hasta) return false;
        return true;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}
