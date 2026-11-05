import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionEntrenamiento } from '../../domain/entities/sesion-entrenamiento.entity';
import { Serie } from '../../domain/entities/serie.entity';
import type { ISesionEntrenamientoRepository } from '../../domain/interfaces/sesion-entrenamiento.repository-interface';
import { RegistroConcurrenteException } from '../../domain/exceptions/registro-concurrente.exception';

@Injectable()
export class SesionEntrenamientoRepository implements ISesionEntrenamientoRepository {
  constructor(
    @InjectRepository(SesionEntrenamiento)
    private readonly sesiones: Repository<SesionEntrenamiento>,
    @InjectRepository(Serie) private readonly series: Repository<Serie>,
  ) {}

  buscarDelDia(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
  ): Promise<SesionEntrenamiento | null> {
    return this.sesiones
      .createQueryBuilder('sesion')
      .leftJoinAndSelect('sesion.seriesRegistradas', 'serie')
      .where('sesion.deportistaId = :deportistaId', { deportistaId })
      .andWhere('sesion.rutinaId = :rutinaId', { rutinaId })
      .andWhere('sesion.fecha = :fecha', { fecha })
      .getOne();
  }

  buscarSeriesDelEjercicio(
    deportistaId: number,
    ejercicioId: number,
  ): Promise<Serie[]> {
    return this.series.find({
      where: { ejercicioId, sesion: { deportistaId } },
    });
  }

  async guardar(sesion: SesionEntrenamiento): Promise<SesionEntrenamiento> {
    try {
      // save + cascade usa una transacción para la raíz y todas sus series.
      return await this.sesiones.save(sesion);
    } catch (error) {
      const fallo = error as {
        driverError?: { code?: string; message?: string };
      };
      if (
        fallo.driverError?.code === 'ER_DUP_ENTRY' &&
        /uq_sesion_deportista_rutina_fecha|uq_serie_sesion_ejercicio_numero/.test(
          fallo.driverError.message ?? '',
        )
      ) {
        throw new RegistroConcurrenteException();
      }
      throw error;
    }
  }
}
