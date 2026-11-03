import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class MedicionesQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deportista_id?: number;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
