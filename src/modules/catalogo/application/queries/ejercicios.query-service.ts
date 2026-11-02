import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from '../../domain/entities/ejercicio.entity';
import { EjercicioResponseDto } from '../../dto/ejercicio-response.dto';
import { EjercicioMapper } from '../../mappers/ejercicio.mapper';
import { EjerciciosQuery } from './ejercicios.query';

// QueryService: consultas de solo lectura, no pasan por el dominio y devuelven DTOs
@Injectable()
export class EjerciciosQueryService {
  constructor(
    @InjectRepository(Ejercicio)
    private readonly repository: Repository<Ejercicio>,
  ) {}

  async listarEjercicios(
    query: EjerciciosQuery,
  ): Promise<EjercicioResponseDto[]> {
    const qb = this.repository.createQueryBuilder('ejercicio'); //createQueryBuilder('ejercicio') crea un query builder para la entidad Ejercicio

    if (query.grupo_muscular) {
      //if (query.grupo_muscular) verifica si el parámetro grupo_muscular está presente en la consulta. Si es así, se agrega una condición al query builder para filtrar los ejercicios por el grupo muscular especificado.
      qb.andWhere('ejercicio.grupoMuscular = :grupoMuscular', {
        grupoMuscular: query.grupo_muscular,
      });
    }
    //si el parámetro grupo_muscular no está presente, se omite la condición y se devuelven todos los ejercicios sin filtrar por grupo muscular pero si ordenados.

    const ejercicios = await qb
      .orderBy('ejercicio.grupoMuscular', 'ASC') //ordena los ejercicios primero por grupo muscular en orden ascendente y luego por nombre en orden ascendente.
      .addOrderBy('ejercicio.nombre', 'ASC')
      .getMany(); //getMany() ejecuta la consulta y devuelve un array de entidades Ejercicio que cumplen con los criterios de búsqueda y ordenamiento especificados.

    return ejercicios.map((ejercicio) => EjercicioMapper.aDto(ejercicio)); //mapper convierte cada entidad Ejercicio en un DTO EjercicioResponseDto
  }
}
