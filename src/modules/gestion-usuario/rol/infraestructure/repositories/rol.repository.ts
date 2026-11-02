import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../../domain/entities/rol.entity';
import { RolNombre } from '../../domain/enums/rol-nombre.enum';
import { IRolRepository } from '../../domain/interfaces/rol.repository-interface';

@Injectable()
export class RolRepository implements IRolRepository {
  constructor(
    @InjectRepository(Rol)
    private readonly repository: Repository<Rol>,
  ) {}

  buscarPorNombre(nombre: RolNombre): Promise<Rol | null> {
    return this.repository.findOne({ where: { nombre } });
  }

  crear(nombre: RolNombre): Promise<Rol> {
    return this.repository.save(this.repository.create({ nombre }));
  }
}
