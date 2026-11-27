import { Inject, Injectable } from '@nestjs/common';
import type { ISesionEntrenamientoRepository } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { ISesionEntrenamientoRepositoryToken } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { CalculadoraResumen } from '../../domain/services/calculadora-resumen.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import type { ResumenProgresoResponseDto } from '../../dto/progreso-response.dto';
import { ProgresoMapper } from '../../mappers/progreso.mapper';
import { FECHA_ACTUAL_REGISTRO } from '../use-cases/registrar-serie.use-case';

// QueryService del resumen de progreso: consulta de solo lectura que devuelve un DTO.
// Igual que SesionesQueryService (US-20): las sesiones se leen por la interfaz del repositorio,
// no con TypeORM directo; los récords los marca DetectorRecordPersonal y los números los calcula
// CalculadoraResumen (los dos son services de dominio).
@Injectable()
export class ResumenProgresoQueryService {
  constructor(
    @Inject(ISesionEntrenamientoRepositoryToken)
    private readonly repositorioSesiones: ISesionEntrenamientoRepository,

    private readonly calculadoraResumen: CalculadoraResumen,

    // Qué series fueron récord personal (RN9): la misma regla que al registrar y que en US-20
    private readonly detectorRecord: DetectorRecordPersonal,

    // La semana del resumen sale de la fecha de hoy del servidor; se inyecta para fijarla en los tests
    @Inject(FECHA_ACTUAL_REGISTRO)
    private readonly fechaActual: () => string,
  ) {}

  // Resumen de esta semana (lunes a domingo): récords personales, volumen (y el de la semana
  // anterior), sesiones y series. RN17: el deportista sale del token, así que solo ve lo suyo.
  async buscarResumen(
    deportistaId: number,
  ): Promise<ResumenProgresoResponseDto> {
    // Toda la historia (sin desde ni hasta): un récord de esta semana se mide contra todo lo anterior
    const sesiones = await this.repositorioSesiones.buscarSesiones({
      deportistaId,
    });

    // Las mismas series récord que muestra el historial de sesiones (US-20)
    const seriesRecord = this.detectorRecord.seriesRecord(
      sesiones.flatMap((sesion) => sesion.series),
    );

    const series = sesiones.flatMap((sesion) =>
      sesion.series.map((serie) => ({
        sesionId: sesion.id,
        fecha: sesion.fecha,
        peso: serie.peso.valor,
        repeticiones: serie.repeticiones.valor,
        record: seriesRecord.has(serie.id),
      })),
    );

    return ProgresoMapper.aResumenDto(
      this.calculadoraResumen.resumir(series, this.fechaActual()),
    );
  }
}
