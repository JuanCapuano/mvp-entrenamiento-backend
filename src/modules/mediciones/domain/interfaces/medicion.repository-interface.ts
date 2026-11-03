import { MedicionCorporal } from '../entities/medicion-corporal.entity';

export const IMedicionRepositoryToken = 'IMedicionRepository';

export interface IMedicionRepository {
  buscarDelDia(
    deportistaId: number,
    fecha: string,
  ): Promise<MedicionCorporal | null>;
  guardar(medicion: MedicionCorporal): Promise<MedicionCorporal>;
  buscarPorDeportistaYFechas(
    deportistaId: number,
    desde?: string,
    hasta?: string,
  ): Promise<MedicionCorporal[]>;
}
