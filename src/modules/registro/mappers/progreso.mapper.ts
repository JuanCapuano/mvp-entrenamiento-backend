import type { ProgresoDelEjercicio } from '../domain/services/calculadora-progreso.service';
import type { ProgresoResponseDto } from '../dto/progreso-response.dto';

export class ProgresoMapper {
  // Solo traduce nombres (camelCase → snake_case): los valores ya los calculó CalculadoraProgreso
  static aDto(progreso: ProgresoDelEjercicio): ProgresoResponseDto {
    return {
      record: progreso.record
        ? {
            peso: progreso.record.peso,
            repeticiones: progreso.record.repeticiones,
            fecha: progreso.record.fecha,
          }
        : null,
      por_fecha: progreso.porFecha.map((delDia) => ({
        fecha: delDia.fecha,
        peso_maximo: delDia.pesoMaximo,
        rm_estimado: delDia.rmEstimado,
        mejor_serie: {
          peso: delDia.mejorSerie.peso,
          repeticiones: delDia.mejorSerie.repeticiones,
        },
        volumen: delDia.volumen,
      })),
    };
  }
}
