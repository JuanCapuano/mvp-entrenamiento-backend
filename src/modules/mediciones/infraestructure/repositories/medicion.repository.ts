import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return this.repository.findOne({ where: { deportistaId, fecha } });
  }

  guardar(medicion: MedicionCorporal): Promise<MedicionCorporal> {
    return this.repository.save(medicion);
  }
}
