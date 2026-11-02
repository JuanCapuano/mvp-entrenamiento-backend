import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class IngresarDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  contrasena: string;
}
