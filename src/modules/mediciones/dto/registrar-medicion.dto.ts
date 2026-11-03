import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

// US-21: peso_corporal y altura deben ser números mayores a 0 (RN19)
export class RegistrarMedicionDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso corporal tiene que ser un número.' })
  @IsPositive({ message: 'El peso corporal tiene que ser mayor a 0.' })
  peso_corporal: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La altura tiene que ser un número.' })
  @IsPositive({ message: 'La altura tiene que ser mayor a 0.' })
  altura: number;
}
