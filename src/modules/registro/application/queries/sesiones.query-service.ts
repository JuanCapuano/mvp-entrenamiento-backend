import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IPlanRepository } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import { IPlanRepositoryToken } from '../../../planificacion/domain/interfaces/plan.repository-interface';
import { SesionEntrenamiento } from '../../domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../../domain/entities/serie.entity';
import { CalculadoraCumplimiento } from '../../domain/services/calculadora-cumplimiento.service';
import { SesionDeHoyResponseDto } from '../../dto/sesion-de-hoy-response.dto';
import { UltimasSeriesResponseDto } from '../../dto/ultimas-series-response.dto';
import { SesionDeHoyMapper } from '../../mappers/sesion-de-hoy.mapper';
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
  ) {}

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
