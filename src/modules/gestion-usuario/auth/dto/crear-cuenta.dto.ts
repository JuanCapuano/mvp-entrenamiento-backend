import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { RolNombre } from '../../rol/domain/enums/rol-nombre.enum';

// US-01: nombre, email, contraseña y rol son obligatorios
export class CrearCuentaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una letra y un número.',
  })
  contrasena: string;

  @IsEnum(RolNombre, {
    message: `El rol debe ser ${Object.values(RolNombre).join(' o ')}.`,
  })
  rol: RolNombre;
}
