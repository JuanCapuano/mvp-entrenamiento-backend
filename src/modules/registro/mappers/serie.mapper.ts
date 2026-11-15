import type { Serie } from '../domain/entities/serie.entity';
import type { RegistrarSerieResponseDto } from '../dto/registrar-serie-response.dto';
import type { CorregirSerieResponseDto } from '../dto/corregir-serie-response.dto';

export class SerieMapper {
  static aDto(
    serie: Serie,
    recordPersonal: boolean,
  ): RegistrarSerieResponseDto {
    return {
      serie_id: serie.id,
      numero: serie.numeroSerie,
      record_personal: recordPersonal,
    };
  }

  // US-17: PATCH /api/series/{id}. El número no cambia, así que no se devuelve.
  static aCorregidaDto(
    serie: Serie,
    recordPersonal: boolean,
  ): CorregirSerieResponseDto {
    return { serie_id: serie.id, record_personal: recordPersonal };
  }
}
