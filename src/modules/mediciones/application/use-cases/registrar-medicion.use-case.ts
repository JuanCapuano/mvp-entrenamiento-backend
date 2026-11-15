import { Inject, Injectable } from '@nestjs/common';
import { fechaActual } from '../../../common/helpers/fecha-actual.helper';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import type { IMedicionRepository } from '../../domain/interfaces/medicion.repository-interface';
import { IMedicionRepositoryToken } from '../../domain/interfaces/medicion.repository-interface';
import { Altura } from '../../domain/value-objects/altura.vo';
import { PesoCorporal } from '../../domain/value-objects/peso-corporal.vo';
import { MedicionRegistradaResponseDto } from '../../dto/medicion-response.dto';
import { RegistrarMedicionDto } from '../../dto/registrar-medicion.dto';
import { MedicionMapper } from '../../mappers/medicion.mapper';

// US-21 (CU17): los VOs validan (RN19, 422) → medición de hoy → la crea o la reemplaza → guarda
@Injectable()
export class RegistrarMedicionUseCase {
  constructor(
    @Inject(IMedicionRepositoryToken)
    private readonly medicionRepository: IMedicionRepository,
  ) {}

  async execute(
    deportistaId: number,
    dto: RegistrarMedicionDto,
  ): Promise<MedicionRegistradaResponseDto> {
    const pesoCorporal = PesoCorporal.crear(dto.peso_corporal);
    const altura = Altura.crear(dto.altura);
    const hoy = fechaActual(); // la fecha la pone el servidor

    let medicion = await this.medicionRepository.buscarDelDia(
      deportistaId,
      hoy,
    );
    if (medicion) {
      medicion.reemplazar(pesoCorporal, altura);
    } else {
      medicion = MedicionCorporal.registrar(
        deportistaId,
        pesoCorporal,
        altura,
        hoy,
      );
    }

    const guardada = await this.medicionRepository.guardar(medicion);
    return MedicionMapper.aRegistradaDto(guardada);
  }
}
