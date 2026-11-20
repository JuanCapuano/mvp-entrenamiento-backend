import type { Serie } from '../domain/entities/serie.entity';
import type { UltimasSeriesResponseDto } from '../dto/ultimas-series-response.dto';

export class UltimasSeriesMapper {
  // Las series salen ordenadas por su número, sin id: no se pueden corregir (RN8)
  static aDto(fecha: string, series: Serie[]): UltimasSeriesResponseDto {
    return {
      fecha,
      series: [...series]
        .sort((a, b) => a.numeroSerie - b.numeroSerie)
        .map((serie) => ({
          numero: serie.numeroSerie,
          peso: serie.peso.valor,
          repeticiones: serie.repeticiones.valor,
          rir: serie.rir.valor,
        })),
    };
  }

  static sinHistorial(): UltimasSeriesResponseDto {
    return { fecha: null, series: [] };
  }
}
