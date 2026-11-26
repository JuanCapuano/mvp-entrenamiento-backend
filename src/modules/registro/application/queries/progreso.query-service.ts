import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from '../../../catalogo/domain/entities/ejercicio.entity';
import { Serie } from '../../domain/entities/serie.entity';
import { CalculadoraProgreso } from '../../domain/services/calculadora-progreso.service';
import type {
  EjercicioConProgresoResponseDto,
  ProgresoResponseDto,
} from '../../dto/progreso-response.dto';
import { ProgresoMapper } from '../../mappers/progreso.mapper';

// QueryService del progreso (US-19): consultas de solo lectura que devuelven DTOs.
// Los cálculos (récord, 1RM, volumen) los decide el service de dominio CalculadoraProgreso.
// RN17: el deportista sale del token, así que solo ve lo suyo.
@Injectable()
export class ProgresoQueryService {
  constructor(
    @InjectRepository(Serie)
    private readonly series: Repository<Serie>,

    private readonly calculadoraProgreso: CalculadoraProgreso,
  ) {}

  // CU11: por fecha, peso máximo, 1RM estimado, mejor serie y volumen; y el récord personal.
  // Incluye todas las sesiones del ejercicio, aunque sean de planes distintos.
  async buscarProgreso(
    deportistaId: number,
    ejercicioId: number,
  ): Promise<ProgresoResponseDto> {
    const series = await this.series
      .createQueryBuilder('serie')
      .innerJoinAndSelect('serie.sesion', 'sesion')
      .where('sesion.deportistaId = :deportistaId', { deportistaId })
      .andWhere('serie.ejercicioId = :ejercicioId', { ejercicioId })
      .orderBy('sesion.fecha', 'ASC')
      .addOrderBy('sesion.id', 'ASC')
      .addOrderBy('serie.numeroSerie', 'ASC')
      .getMany();

    const progreso = this.calculadoraProgreso.calcular(
      series.map((serie) => ({
        fecha: serie.sesion.fecha,
        peso: serie.peso.valor,
        repeticiones: serie.repeticiones.valor,
      })),
    );

    return ProgresoMapper.aDto(progreso);
  }

  // CU23: los ejercicios que el deportista registró alguna vez, para elegir cuál ver.
  // El nombre es del catálogo: join de solo lectura con su tabla (permitido en un QueryService).
  async buscarEjerciciosConProgreso(
    deportistaId: number,
  ): Promise<EjercicioConProgresoResponseDto[]> {
    const filas = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .innerJoin(Ejercicio, 'ejercicio', 'ejercicio.id = serie.ejercicioId')
      .select('ejercicio.id', 'id')
      .addSelect('ejercicio.nombre', 'nombre')
      .where('sesion.deportistaId = :deportistaId', { deportistaId })
      .distinct(true)
      .orderBy('ejercicio.nombre', 'ASC')
      .getRawMany<{ id: number | string; nombre: string }>();

    return filas.map((fila) => ({ id: Number(fila.id), nombre: fila.nombre }));
  }
}
