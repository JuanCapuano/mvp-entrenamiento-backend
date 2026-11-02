import { IsEnum, IsOptional } from 'class-validator';
import { GrupoMuscular } from '../../domain/entities/ejercicio.entity';

// QueryObject: criterios de búsqueda del catálogo, todos opcionales (?grupo_muscular=MMII)
export class EjerciciosQuery {
  @IsOptional()
  @IsEnum(GrupoMuscular, {
    message: `El grupo muscular debe ser ${Object.values(GrupoMuscular).join(', ')}.`,
  })
  grupo_muscular?: GrupoMuscular;
}
