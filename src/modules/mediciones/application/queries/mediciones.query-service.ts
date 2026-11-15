import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type { UsuarioToken } from '../../../gestion-usuario/auth/usuario-actual.decorator';
import { RolNombre } from '../../../gestion-usuario/rol/domain/enums/rol-nombre.enum';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import { MedicionResponseDto } from '../../dto/medicion-response.dto';
import { MedicionMapper } from '../../mappers/medicion.mapper';
import { MedicionesQuery } from './mediciones.query';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class MedicionesQueryService {
  constructor(
    @InjectRepository(MedicionCorporal)
    private readonly repository: Repository<MedicionCorporal>,

    // Solo lectura de una tabla de otro módulo (usuario), para verificar el vínculo (RN17).
    // Nunca se escribe en ella.
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  // CU18: evolución del peso corporal, en orden cronológico (US-21)
  async listarMediciones(
    usuario: UsuarioToken,
    query: MedicionesQuery,
  ): Promise<MedicionResponseDto[]> {
    const deportistaId = await this.resolverDeportista(usuario, query);

    const where: FindOptionsWhere<MedicionCorporal> = { deportistaId };
    if (query.desde && query.hasta) {
      where.fecha = Between(query.desde, query.hasta);
    } else if (query.desde) {
      where.fecha = MoreThanOrEqual(query.desde);
    } else if (query.hasta) {
      where.fecha = LessThanOrEqual(query.hasta);
    }

    const mediciones = await this.repository.find({
      where,
      order: { fecha: 'ASC' },
    });

    return mediciones.map((medicion) => MedicionMapper.aDto(medicion));
  }

  // RN17: el deportista solo ve sus mediciones; el entrenador, las de un deportista vinculado con él
  private async resolverDeportista(
    usuario: UsuarioToken,
    query: MedicionesQuery,
  ): Promise<number> {
    if (usuario.rol === RolNombre.DEPORTISTA) {
      if (
        query.deportista_id !== undefined &&
        query.deportista_id !== usuario.id
      ) {
        throw new ForbiddenException('Solo podés ver tus propias mediciones.');
      }
      return usuario.id;
    }

    if (query.deportista_id === undefined) {
      throw new UnprocessableEntityException(
        'El deportista_id es obligatorio.',
      );
    }

    const vinculado = await this.usuarios.exists({
      where: { id: query.deportista_id, entrenadorId: usuario.id },
    });
    if (!vinculado) {
      throw new ForbiddenException('El deportista no está vinculado con vos.');
    }
    return query.deportista_id;
  }
}
