import { Inject, Injectable } from '@nestjs/common';
import type { IMedicionRepository } from '../../domain/interfaces/medicion.repository-interface';
import { IMedicionRepositoryToken } from '../../domain/interfaces/medicion.repository-interface';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import { PesoCorporal } from '../../domain/value-objects/peso-corporal.vo';
import { Altura } from '../../domain/value-objects/altura.vo';
import { RegistrarMedicionDto } from '../../dto/registrar-medicion.dto';
import { MedicionResponseDto } from '../../dto/medicion-response.dto';
import { fechaActual } from '../../../common/helpers/fecha-actual.helper';

// US-21: registra peso corporal y altura del deportista con la fecha del día.
// RN19: una medición por día; si ya existe la de hoy, reemplaza a la anterior.
@Injectable()
export class RegistrarMedicionUseCase {
  constructor(
    @Inject(IMedicionRepositoryToken)
    private readonly medicionRepository: IMedicionRepository,
  ) {}

  async execute(
    deportistaId: number,
    dto: RegistrarMedicionDto,
    fechaOverride?: string,
  ): Promise<MedicionResponseDto> {
    const pesoVo = new PesoCorporal(dto.peso_corporal);
    const alturaVo = new Altura(dto.altura);
    const fecha = fechaOverride ?? fechaActual();

    let medicion = await this.medicionRepository.buscarDelDia(
      deportistaId,
      fecha,
    );

    if (medicion) {
      // Reemplaza a la anterior del mismo día
      medicion.actualizar(pesoVo, alturaVo);
    } else {
      // Crea una nueva medición para el día
      medicion = MedicionCorporal.crear(deportistaId, fecha, pesoVo, alturaVo);
    }

    const guardada = await this.medicionRepository.guardar(medicion);

    return {
      id: guardada.id,
      fecha: guardada.fecha,
    };
  }
}
