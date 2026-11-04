import { IsEnum, IsOptional } from 'class-validator';
import {
  GrupoMuscular,
  Subgrupo,
} from '../../domain/entities/ejercicio.entity';

// QueryObject: criterios de búsqueda del catálogo, todos opcionales (?grupo_muscular=PIERNA&subgrupo=GLUTEO)
export class EjerciciosQuery {
  @IsOptional()
  @IsEnum(GrupoMuscular, {
    message: `El grupo muscular debe ser ${Object.values(GrupoMuscular).join(', ')}.`,
  })
  grupo_muscular?: GrupoMuscular;

  @IsOptional()
  @IsEnum(Subgrupo, {
    message: `El subgrupo debe ser ${Object.values(Subgrupo).join(', ')}.`,
  })
  subgrupo?: Subgrupo;
}
