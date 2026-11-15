import {
  UnprocessableEntityException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { IPlanRepository } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import { IPlanRepositoryToken } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import type { ISesionEntrenamientoRepository } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { ISesionEntrenamientoRepositoryToken } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import type { IPublicadorEventosRegistro } from '../publicador-eventos-registro.interface';
import { IPublicadorEventosRegistroToken } from '../publicador-eventos-registro.interface';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { VerificadorEjercicioPlanVigente } from '../../domain/services/verificador-ejercicio-plan-vigente.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { RegistroConcurrenteException } from '../../domain/exceptions/registro-concurrente.exception';
import { SerieRegistrada } from '../../domain/events/serie-registrada.event';
import { RecordPersonalSuperado } from '../../domain/events/record-personal-superado.event';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { RegistrarSerieDto } from '../../dto/registrar-serie.dto';
import { RegistrarSerieResponseDto } from '../../dto/registrar-serie-response.dto';
import { SerieMapper } from '../../mappers/serie.mapper';

export const FECHA_ACTUAL_REGISTRO = 'FECHA_ACTUAL_REGISTRO';

@Injectable()
export class RegistrarSerieUseCase {
  constructor(
    @Inject(ISesionEntrenamientoRepositoryToken)
    private readonly sesiones: ISesionEntrenamientoRepository,
    @Inject(IPlanRepositoryToken) private readonly planes: IPlanRepository,
    private readonly factory: SesionEntrenamientoFactory,
    private readonly verificador: VerificadorEjercicioPlanVigente,
    private readonly detector: DetectorRecordPersonal,
    @Inject(IPublicadorEventosRegistroToken)
    private readonly eventos: IPublicadorEventosRegistro,
    //Inyecta el helper de fecha-actual.helper.ts
    @Inject(FECHA_ACTUAL_REGISTRO) private readonly fechaActual: () => string,
  ) {}

  // El método execute intenta registrar una serie de un deportista. Si ocurre un conflicto de registro concurrente, reintenta hasta 3 veces antes de lanzar una excepción.
  async execute(
    deportistaId: number,
    dto: RegistrarSerieDto,
  ): Promise<RegistrarSerieResponseDto> {
    const peso = Peso.crear(dto.peso);
    const repeticiones = Repeticiones.crear(dto.repeticiones);
    const rir = RIR.crear(dto.rir);

    for (let intento = 0; intento < 3; intento++) {
      const hoy = this.fechaActual();
      const plan = await this.planes.buscarPlanVigenteDelDeportista(
        deportistaId,
        hoy,
      );
      const planVigente = this.verificador.verificar(
        plan,
        dto.rutina_id,
        dto.ejercicio_id,
      );
      let sesion = await this.sesiones.buscarDelDia(
        deportistaId,
        dto.rutina_id,
        hoy,
      );
      if (sesion && sesion.deportistaId !== deportistaId) {
        throw new ForbiddenException('La sesión pertenece a otro deportista.');
      }
      const anteriores = await this.sesiones.buscarSeriesDelEjercicio(
        deportistaId,
        dto.ejercicio_id,
      );
      if (sesion) {
        sesion.registrarSerie(
          deportistaId,
          hoy,
          dto.ejercicio_id,
          peso,
          repeticiones,
          rir,
        );
      } else {
        sesion = this.factory.crear(
          deportistaId,
          planVigente.id,
          dto.rutina_id,
          hoy,
          dto.ejercicio_id,
          peso,
          repeticiones,
          rir,
        );
      }
      const nueva = sesion.series[sesion.series.length - 1];
      const recordPersonal = this.detector.superaRecord(nueva, anteriores);
      let guardada;
      try {
        guardada = await this.sesiones.guardar(sesion);
      } catch (error) {
        if (error instanceof RegistroConcurrenteException) continue;
        throw error;
      }
      const serie = guardada.series.find(
        (serie) =>
          serie.ejercicioId === dto.ejercicio_id &&
          serie.numeroSerie === nueva.numeroSerie,
      )!;
      this.eventos.emit(
        'serie.registrada',
        new SerieRegistrada(
          deportistaId,
          guardada.id,
          serie.id,
          serie.ejercicioId,
          hoy,
        ),
      );
      if (recordPersonal) {
        this.eventos.emit(
          'record-personal.superado',
          new RecordPersonalSuperado(
            deportistaId,
            serie.ejercicioId,
            serie.id,
            peso.valor,
            repeticiones.valor,
            hoy,
          ),
        );
      }
      return SerieMapper.aDto(serie, recordPersonal);
    }
    throw new UnprocessableEntityException(
      'Se registraron series simultáneamente. Volvé a intentar.',
    );
  }
}
