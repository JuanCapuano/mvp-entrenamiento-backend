import type { ProgresoDelEjercicio } from '../domain/services/calculadora-progreso.service';
import type { ResumenDeLaSemana } from '../domain/services/calculadora-resumen.service';
import type {
  ProgresoResponseDto,
  ResumenProgresoResponseDto,
} from '../dto/progreso-response.dto';

export class ProgresoMapper {
  // Solo traduce nombres: los valores ya los calculó CalculadoraResumen
  static aResumenDto(resumen: ResumenDeLaSemana): ResumenProgresoResponseDto {
    return {
      desde: resumen.desde,
      hasta: resumen.hasta,
      records: resumen.records,
      volumen: resumen.volumen,
      volumen_anterior: resumen.volumenAnterior,
      sesiones: resumen.sesiones,
      series: resumen.series,
    };
  }

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
