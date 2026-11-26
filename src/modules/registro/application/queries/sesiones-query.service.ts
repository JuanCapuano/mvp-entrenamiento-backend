import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IPlanRepository } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import { IPlanRepositoryToken } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import type { IEjercicioRepository } from '../../../catalogo/domain/interfaces/ejercicio.repository-interface';
import { IEjercicioRepositoryToken } from '../../../catalogo/domain/interfaces/ejercicio.repository-interface';
import { SesionEntrenamiento } from '../../domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../../domain/entities/serie.entity';
import type { ISesionEntrenamientoRepository } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { ISesionEntrenamientoRepositoryToken } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { BuscarSesionesQuery } from './buscar-sesiones.query';
import { CalculadoraCumplimiento } from '../../domain/services/calculadora-cumplimiento.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { SesionDeHoyResponseDto } from '../../dto/sesion-de-hoy-response.dto';
import { SesionHistorialResponseDto } from '../../dto/sesion-historial-response.dto';
import { UltimasSeriesResponseDto } from '../../dto/ultimas-series-response.dto';
import { SesionDeHoyMapper } from '../../mappers/sesion-de-hoy.mapper';
import {
  SesionHistorialMapper,
  type RutinaDeLaSesion,
} from '../../mappers/sesion-historial.mapper';
import { UltimasSeriesMapper } from '../../mappers/ultimas-series.mapper';
import { FECHA_ACTUAL_REGISTRO } from '../use-cases/registrar-serie.use-case';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class SesionesQueryService {
  constructor(
    @InjectRepository(SesionEntrenamiento)
    private readonly sesiones: Repository<SesionEntrenamiento>,

    @InjectRepository(Serie)
    private readonly series: Repository<Serie>,

    // La fecha de hoy la pone el servidor; se inyecta para poder fijarla en los tests
    @Inject(FECHA_ACTUAL_REGISTRO)
    private readonly fechaActual: () => string,

    // Lo prescripto (series objetivo) es de planificación: se pide por su interfaz
    @Inject(IPlanRepositoryToken)
    private readonly planes: IPlanRepository,

    private readonly calculadoraCumplimiento: CalculadoraCumplimiento,

    // US-20: las sesiones se leen por la interfaz del repositorio, no con TypeORM directo
    @Inject(ISesionEntrenamientoRepositoryToken)
    private readonly repositorioSesiones: ISesionEntrenamientoRepository,

    // Nombre de cada ejercicio: es del catálogo, se pide por su interfaz
    @Inject(IEjercicioRepositoryToken)
    private readonly ejercicios: IEjercicioRepository,

    // US-20: marcar las series que fueron récord personal (RN9), con la misma regla que al registrar
    private readonly detectorRecord: DetectorRecordPersonal,
  ) {}

  // US-20 (CU10): sesiones del deportista de la más reciente a la más antigua, con la rutina,
  // las series agrupadas por ejercicio y el cumplimiento de la sesión y de cada ejercicio.
  // RN17: el deportista viene en el query (lo pone BuscarSesionesQueryFactory desde el token).
  async buscarSesiones(
    query: BuscarSesionesQuery,
  ): Promise<SesionHistorialResponseDto[]> {
    const sesiones = await this.repositorioSesiones.buscarSesiones(query);
    if (sesiones.length === 0) return [];

    const rutinas = await this.buscarRutinasDeLasSesiones(sesiones);
    const nombresEjercicios = await this.buscarNombresEjercicios([
      ...rutinas.values(),
    ]);
    const seriesRecord = await this.buscarSeriesRecord(
      query.deportistaId,
      sesiones,
    );

    return sesiones.map((sesion) =>
      SesionHistorialMapper.aDto(
        sesion,
        rutinas.get(sesion.rutinaId) ?? null,
        nombresEjercicios,
        this.calculadoraCumplimiento,
        seriesRecord,
      ),
    );
  }

  // Ids de las series que, cuando se registraron, superaron a todas las anteriores del ejercicio
  // (RN9). Se mira todo el historial del deportista, no solo el rango pedido: una serie del rango
  // puede haber superado una marca de antes. Las series se registran siempre el día de hoy (RN12),
  // así que el orden de id es el orden en que se hicieron.
  private async buscarSeriesRecord(
    deportistaId: number,
    sesiones: SesionEntrenamiento[],
  ): Promise<Set<number>> {
    const ejercicioIds = [
      ...new Set(
        sesiones.flatMap((sesion) =>
          sesion.series.map((serie) => serie.ejercicioId),
        ),
      ),
    ];
    const historiales = await Promise.all(
      ejercicioIds.map((ejercicioId) =>
        this.repositorioSesiones.buscarSeriesDelEjercicio(
          deportistaId,
          ejercicioId,
        ),
      ),
    );

    const records = new Set<number>();
    for (const historial of historiales) {
      const enOrden = [...historial].sort((a, b) => a.id - b.id);
      enOrden.forEach((serie, i) => {
        if (this.detectorRecord.superaRecord(serie, enOrden.slice(0, i))) {
          records.add(serie.id);
        }
      });
    }
    return records;
  }

  // Rutina (nombre y dosificaciones) de cada sesión, por id de rutina. Puede ser de un plan que
  // ya no está vigente, así que se busca por el plan de la sesión (un pedido por plan).
  private async buscarRutinasDeLasSesiones(
    sesiones: SesionEntrenamiento[],
  ): Promise<Map<number, RutinaDeLaSesion>> {
    const planIds = [...new Set(sesiones.map((sesion) => sesion.planId))];
    const planes = await Promise.all(
      planIds.map((planId) => this.planes.buscarPorId(planId)),
    );

    const rutinas = new Map<number, RutinaDeLaSesion>();
    for (const rutina of planes.flatMap((plan) => plan?.rutinas ?? [])) {
      rutinas.set(rutina.id, {
        nombre: rutina.nombre,
        dosificaciones: rutina.dosificacionesOrdenadas(),
      });
    }
    return rutinas;
  }

  // ejercicioId → nombre, un pedido por ejercicio distinto de las rutinas
  private async buscarNombresEjercicios(
    rutinas: RutinaDeLaSesion[],
  ): Promise<Map<number, string>> {
    const ids = [
      ...new Set(
        rutinas.flatMap((rutina) =>
          rutina.dosificaciones.map((d) => d.ejercicioId),
        ),
      ),
    ];
    const ejercicios = await Promise.all(
      ids.map((id) => this.ejercicios.buscarPorId(id)),
    );

    return new Map(
      ejercicios
        .filter((ejercicio) => ejercicio !== null)
        .map((ejercicio) => [ejercicio.id, ejercicio.nombre]),
    );
  }

  // US-16: series que el deportista lleva hoy en cada ejercicio de la rutina, frente a las
  // series objetivo, y el cumplimiento de la sesión. Si hoy no registró nada, 0 % y sin series.
  // RN17: el deportista sale del token y la rutina tiene que ser de su plan vigente (403 si no).
  async buscarSesionDeHoy(
    deportistaId: number,
    rutinaId: number,
  ): Promise<SesionDeHoyResponseDto> {
    const hoy = this.fechaActual();

    const dosificaciones =
      await this.planes.buscarDosificacionesDeRutinaVigente(
        deportistaId,
        rutinaId,
        hoy,
      );
    if (!dosificaciones) {
      throw new ForbiddenException('La rutina no es de tu plan vigente.');
    }

    const sesion = await this.sesiones
      .createQueryBuilder('sesion')
      .leftJoinAndSelect('sesion.seriesRegistradas', 'serie')
      .where('sesion.deportistaId = :deportistaId', { deportistaId })
      .andWhere('sesion.rutinaId = :rutinaId', { rutinaId })
      .andWhere('sesion.fecha = :hoy', { hoy })
      .getOne();
    const series = sesion?.series ?? [];

    return SesionDeHoyMapper.aDto(
      dosificaciones,
      series,
      this.calculadoraCumplimiento.calcularSesion(dosificaciones, series),
    );
  }

  // US-14 (CU9): series de la última sesión anterior a hoy en la que el deportista hizo el ejercicio.
  // Las de hoy no entran: el front las muestra aparte, con la sesión del día.
  // RN17: el deportista sale del token, así que solo ve lo suyo.
  async buscarUltimasSeries(
    deportistaId: number,
    ejercicioId: number,
  ): Promise<UltimasSeriesResponseDto> {
    const ultima = await this.sesiones
      .createQueryBuilder('sesion')
      .innerJoin('sesion.seriesRegistradas', 'serie')
      .where('sesion.deportistaId = :deportistaId', { deportistaId })
      .andWhere('serie.ejercicioId = :ejercicioId', { ejercicioId })
      .andWhere('sesion.fecha < :hoy', { hoy: this.fechaActual() })
      .orderBy('sesion.fecha', 'DESC')
      // Dos rutinas el mismo día con el mismo ejercicio: la que se empezó última
      .addOrderBy('sesion.id', 'DESC')
      .limit(1)
      .getOne();

    if (!ultima) return UltimasSeriesMapper.sinHistorial();

    const series = await this.series.find({
      where: { sesionId: ultima.id, ejercicioId },
      order: { numeroSerie: 'ASC' },
    });

    return UltimasSeriesMapper.aDto(ultima.fecha, series);
  }
}
