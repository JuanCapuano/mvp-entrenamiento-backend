import { SesionEntrenamiento } from '../entities/sesion-entrenamiento.entity';
import { Peso } from '../value-objects/peso.vo';
import { Repeticiones } from '../value-objects/repeticiones.vo';
import { RIR } from '../value-objects/rir.vo';

export class SesionEntrenamientoFactory {
  crear(
    deportistaId: number,
    planId: number,
    rutinaId: number,
    hoy: string,
    ejercicioId: number,
    peso: Peso,
    repeticiones: Repeticiones,
    rir: RIR,
  ): SesionEntrenamiento {
    return SesionEntrenamiento.iniciar(
      deportistaId,
      planId,
      rutinaId,
      hoy,
      ejercicioId,
      peso,
      repeticiones,
      rir,
    );
  }
}
