import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ISesionEntrenamientoRepository } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { ISesionEntrenamientoRepositoryToken } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import type { IPublicadorEventosRegistro } from '../publicador-eventos-registro.interface';
import { IPublicadorEventosRegistroToken } from '../publicador-eventos-registro.interface';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { SerieCorregida } from '../../domain/events/serie-corregida.event';
import { RecordPersonalSuperado } from '../../domain/events/record-personal-superado.event';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { CorregirSerieDto } from '../../dto/corregir-serie.dto';
import { CorregirSerieResponseDto } from '../../dto/corregir-serie-response.dto';
import { SerieMapper } from '../../mappers/serie.mapper';
import { FECHA_ACTUAL_REGISTRO } from './registrar-serie.use-case';

// US-17 (CU8): busca la sesión de la serie → la raíz corrige (RN8) → detecta el récord de nuevo
// con el valor corregido (RN9) → guarda → publica los eventos
@Injectable()
export class CorregirSerieUseCase {
  constructor(
    @Inject(ISesionEntrenamientoRepositoryToken)
    private readonly sesiones: ISesionEntrenamientoRepository,
    private readonly detector: DetectorRecordPersonal,
    @Inject(IPublicadorEventosRegistroToken)
    private readonly eventos: IPublicadorEventosRegistro,
    // La fecha de hoy la pone el servidor; se inyecta para poder fijarla en los tests
    @Inject(FECHA_ACTUAL_REGISTRO) private readonly fechaActual: () => string,
  ) {}

  async execute(
    deportistaId: number,
    serieId: number,
    dto: CorregirSerieDto,
  ): Promise<CorregirSerieResponseDto> {
    const sesion = await this.sesiones.buscarPorSerie(serieId);
    if (!sesion) {
      throw new NotFoundException('La serie no existe.');
    }
    // RN1 / RN17: solo el deportista que la registró puede corregirla
    if (sesion.deportistaId !== deportistaId) {
      throw new ForbiddenException('La serie no es tuya.');
    }

    const peso = Peso.crear(dto.peso);
    const repeticiones = Repeticiones.crear(dto.repeticiones);
    const rir = RIR.crear(dto.rir);
    const hoy = this.fechaActual();

    const corregida = sesion.corregirSerie(
      deportistaId,
      hoy,
      serieId,
      peso,
      repeticiones,
      rir,
    );

    // El récord se compara con las demás series del ejercicio, sin contar la que se corrige
    const historial = await this.sesiones.buscarSeriesDelEjercicio(
      deportistaId,
      corregida.ejercicioId,
    );
    const recordPersonal = this.detector.superaRecord(
      corregida,
      historial.filter((serie) => serie.id !== serieId),
    );

    const guardada = await this.sesiones.guardar(sesion);

    this.eventos.emit(
      'serie.corregida',
      new SerieCorregida(
        deportistaId,
        guardada.id,
        serieId,
        corregida.ejercicioId,
        hoy,
      ),
    );
    if (recordPersonal) {
      this.eventos.emit(
        'record-personal.superado',
        new RecordPersonalSuperado(
          deportistaId,
          corregida.ejercicioId,
          serieId,
          peso.valor,
          repeticiones.valor,
          hoy,
        ),
      );
    }

    return SerieMapper.aCorregidaDto(corregida, recordPersonal);
  }
}
