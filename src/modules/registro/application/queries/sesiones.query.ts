import { IsDateString, IsOptional } from 'class-validator';

export class SesionesQuery {
  @IsOptional()
  @IsDateString({}, { message: 'Desde debe ser una fecha válida.' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Hasta debe ser una fecha válida.' })
  hasta?: string;
}
