import { MedicionCorporal } from '../entities/medicion-corporal.entity';

export const IMedicionRepositoryToken = 'IMedicionRepository';

// Solo lo que usa RegistrarMedicionUseCase. Lo que se necesita para mostrar va en MedicionesQueryService.
export interface IMedicionRepository {
  buscarDelDia(
    deportistaId: number,
    fecha: string,
  ): Promise<MedicionCorporal | null>;

  guardar(medicion: MedicionCorporal): Promise<MedicionCorporal>;
}
