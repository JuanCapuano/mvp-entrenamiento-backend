import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioResponseDto } from '../../dto/usuario-response.dto';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { DeportistaResponseDto } from '../../dto/deportista-response.dto';
import { fechaActual } from '../../../../common/helpers/fecha-actual.helper';
import { Asignacion } from '../../../../planificacion/domain/entities/asignacion.entity';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class UsuarioQueryService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
      // Solo lectura de una tabla de otro módulo (planificación): permitido en un QueryService, nunca se escribe en ella.
    @InjectRepository(Asignacion)
    private readonly asignaciones: Repository<Asignacion>,
  ) {}

  async buscarPerfil(id: number): Promise<UsuarioResponseDto> {
    const usuario = await this.repository.findOne({ 
      where: { id },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return UsuarioMapper.aDto(usuario);
  }

  // US-04: deportistas vinculados al entrenador del token, con su plan vigente hoy
  async listarDeportistas(entrenadorId: number): Promise<DeportistaResponseDto[]> {
    const deportistas = await this.repository.find({
      where: { entrenadorId },
      order: { nombre: 'ASC' },
    });
    if (deportistas.length === 0) return [];

    // RN12: "hoy" lo pone el servidor. RN11: a lo sumo una asignación vigente por deportista.
    const hoy = fechaActual();
    const vigentes = await this.asignaciones
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.plan', 'p')
      .where('a.deportista_id IN (:...ids)', { ids: deportistas.map((d) => d.id) })
      .andWhere('a.vigencia_desde <= :hoy', { hoy })
      .andWhere('a.vigencia_hasta >= :hoy', { hoy })
      .getMany();

    const porDeportista = new Map(vigentes.map((a) => [a.deportistaId, a]));

    return deportistas.map((deportista) => {
      const a = porDeportista.get(deportista.id);
      return UsuarioMapper.aDeportistaDto(
        deportista,
        a
          ? {
              nombre: a.plan.nombre,
              desde: a.vigencia.desde,
              hasta: a.vigencia.hasta,  
            }
          : null,
      );
    });
  }
}
