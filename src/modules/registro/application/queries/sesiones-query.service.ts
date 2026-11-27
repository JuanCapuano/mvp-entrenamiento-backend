import {
  ForbiddenException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { Rutina } from '../../../planificacion/domain/entities/rutina.entity';
import { AsistenciaResponseDto } from '../../dto/asistencia-response.dto';
import { AsistenciaMapper } from '../../mappers/asistencia.mapper';
import { SesionesQuery } from './sesiones.query';
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

  // Ids de las series que fueron récord personal cuando se registraron (RN9, lo decide
  // DetectorRecordPersonal). Se mira todo el historial de cada ejercicio, no solo el rango pedido:
  // una serie del rango puede haber superado una marca de antes.
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

    return this.detectorRecord.seriesRecord(historiales.flat());
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

  // US-12 (CU14): asistencia de un deportista para su entrenador. Por sesión: fecha, rutina y
  // cumplimiento, de la más reciente a la más antigua. RN17: sin pesos ni repeticiones, y solo
  // de deportistas vinculados con el entrenador del token.
  //
  // Lee dos tablas de otros módulos, solo para lectura (excepción del CLAUDE.md para QueryServices):
  // - usuario: verificar el vínculo, igual que MedicionesQueryService;
  // - rutina y dosificacion: el nombre de la rutina y las series objetivo. No se usa la interfaz
  //   de planificación porque solo devuelve el plan vigente, y la asistencia incluye sesiones
  //   de planes anteriores. RN13 garantiza que esas dosificaciones no cambiaron desde la sesión.
  // Se leen con el EntityManager de la misma conexión (this.sesiones.manager) y no inyectando
  // repositorios nuevos: así esas tablas solo se necesitan al pedir la asistencia.
  async buscarAsistencia(
    entrenadorId: number,
    deportistaId: number,
    query: SesionesQuery,
  ): Promise<AsistenciaResponseDto[]> {
    if (query.desde && query.hasta && query.desde > query.hasta) {
      throw new UnprocessableEntityException(
        'La fecha desde no puede ser posterior a la fecha hasta.',
      );
    }

    // Un deportista inexistente responde igual que uno no vinculado: no revela qué ids existen
    const vinculado = await this.sesiones.manager.exists(Usuario, {
      where: { id: deportistaId, entrenadorId },
    });
    if (!vinculado) {
      throw new ForbiddenException('El deportista no está vinculado con vos.');
    }

    const consulta = this.sesiones
      .createQueryBuilder('sesion')
      .leftJoinAndSelect('sesion.seriesRegistradas', 'serie')
      .where('sesion.deportistaId = :deportistaId', { deportistaId });
    if (query.desde) {
      consulta.andWhere('sesion.fecha >= :desde', { desde: query.desde });
    }
    if (query.hasta) {
      consulta.andWhere('sesion.fecha <= :hasta', { hasta: query.hasta });
    }
    const sesiones = await consulta
      .orderBy('sesion.fecha', 'DESC')
      // Dos rutinas el mismo día: primero la que se empezó última
      .addOrderBy('sesion.id', 'DESC')
      .getMany();
    if (sesiones.length === 0) return [];

    // Una sola consulta para todas las rutinas (no una por sesión)
    const rutinas = await this.sesiones.manager.find(Rutina, {
      where: { id: In([...new Set(sesiones.map((s) => s.rutinaId))]) },
      relations: { dosificaciones: true },
    });
    const rutinaPorId = new Map(rutinas.map((r) => [r.id, r]));

    return sesiones.map((sesion) => {
      const rutina = rutinaPorId.get(sesion.rutinaId);
      // Mismo cálculo que la sesión de hoy (US-16): series registradas frente a objetivo, tope 100 %
      const cumplimiento = this.calculadoraCumplimiento.calcularSesion(
        rutina?.dosificaciones ?? [],
        sesion.series,
      );
      return AsistenciaMapper.aDto(sesion, rutina?.nombre ?? '', cumplimiento);
    });
  }
}
