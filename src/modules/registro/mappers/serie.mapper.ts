import type { Serie } from '../domain/entities/serie.entity';
import type { RegistrarSerieResponseDto } from '../dto/registrar-serie-response.dto';

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
}
