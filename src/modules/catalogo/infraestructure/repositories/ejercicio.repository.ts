import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from '../../domain/entities/ejercicio.entity';
import { IEjercicioRepository } from '../../domain/interfaces/ejercicio.repository-interface';

@Injectable()
export class EjercicioRepository implements IEjercicioRepository {
  constructor(
    @InjectRepository(Ejercicio)
    private readonly repository: Repository<Ejercicio>,
  ) {}

  buscarPorId(id: number): Promise<Ejercicio | null> {
    return this.repository.findOne({ where: { id } });
  }

  existe(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }
}
