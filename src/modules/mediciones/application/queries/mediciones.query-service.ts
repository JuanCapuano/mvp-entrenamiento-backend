import { Inject, Injectable } from '@nestjs/common';
import type { IMedicionRepository } from '../../domain/interfaces/medicion.repository-interface';
import { IMedicionRepositoryToken } from '../../domain/interfaces/medicion.repository-interface';
import { MedicionItemDto } from '../../dto/medicion-response.dto';

@Injectable()
export class MedicionesQueryService {
  constructor(
    @Inject(IMedicionRepositoryToken)
    private readonly medicionRepository: IMedicionRepository,
  ) {}

  async listarMediciones(
    deportistaId: number,
    desde?: string,
    hasta?: string,
  ): Promise<MedicionItemDto[]> {
    const lista = await this.medicionRepository.buscarPorDeportistaYFechas(
      deportistaId,
      desde,
      hasta,
    );

    return lista.map((m) => ({
      fecha: m.fecha,
      peso_corporal: Number(m.pesoCorporal),
      altura: Number(m.altura),
    }));
  }
}
