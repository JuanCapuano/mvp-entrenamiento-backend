import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import { IMedicionRepository } from '../../domain/interfaces/medicion.repository-interface';

@Injectable()
export class MedicionRepository implements IMedicionRepository {
  constructor(
    @InjectRepository(MedicionCorporal)
    private readonly repository: Repository<MedicionCorporal>,
  ) {}

  buscarDelDia(
    deportistaId: number,
    fecha: string,
  ): Promise<MedicionCorporal | null> {
    return this.repository.findOne({
      where: {
        deportistaId,
        fecha,
      },
    });
  }

  guardar(medicion: MedicionCorporal): Promise<MedicionCorporal> {
    return this.repository.save(medicion);
  }

  buscarPorDeportistaYFechas(
    deportistaId: number,
    desde?: string,
    hasta?: string,
  ): Promise<MedicionCorporal[]> {
    const where: any = { deportistaId };

    if (desde && hasta) {
      where.fecha = Between(desde, hasta);
    } else if (desde) {
      where.fecha = MoreThanOrEqual(desde);
    } else if (hasta) {
      where.fecha = LessThanOrEqual(hasta);
    }

    return this.repository.find({
      where,
      order: { fecha: 'ASC' },
    });
  }
}
