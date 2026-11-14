import { MedicionCorporal } from '../domain/entities/medicion-corporal.entity';
import {
  MedicionRegistradaResponseDto,
  MedicionResponseDto,
} from '../dto/medicion-response.dto';

export class MedicionMapper {
  static aRegistradaDto(
    medicion: MedicionCorporal,
  ): MedicionRegistradaResponseDto {
    return { id: medicion.id, fecha: medicion.fecha };
  }

  static aDto(medicion: MedicionCorporal): MedicionResponseDto {
    return {
      fecha: medicion.fecha,
      peso_corporal: medicion.pesoCorporal.valor,
      altura: medicion.altura.valor,
    };
  }
}
