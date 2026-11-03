import { IsNotEmpty, IsString } from 'class-validator';

export class RefrescarTokenDto {
  @IsString({ message: 'El refresh token es obligatorio.' })
  @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
  refresh_token: string;
}
