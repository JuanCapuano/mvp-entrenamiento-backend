import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUsuarioRepository } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import { IUsuarioRepositoryToken } from '../../../usuario/domain/interfaces/usuario.repository-interface';
import type { IRolRepository } from '../../../rol/domain/interfaces/rol.repository-interface';
import { IRolRepositoryToken } from '../../../rol/domain/interfaces/rol.repository-interface';
import { Usuario } from '../../../usuario/domain/entities/usuario.entity';
import { UsuarioMapper } from '../../../usuario/mappers/usuario.mapper';
import { UsuarioResponseDto } from '../../../usuario/dto/usuario-response.dto';
import { CrearCuentaDto } from '../../dto/crear-cuenta.dto';

const SALT_ROUNDS = 10;

// US-01: verifica el email → hashea la contraseña → busca el rol → guarda
@Injectable()
export class CrearCuentaUseCase {
  constructor(
    @Inject(IUsuarioRepositoryToken)
    private readonly usuarioRepository: IUsuarioRepository,

    @Inject(IRolRepositoryToken)
    private readonly rolRepository: IRolRepository,
  ) {}

  async execute(dto: CrearCuentaDto): Promise<UsuarioResponseDto> {
    const existe = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (existe) {
      throw new UnprocessableEntityException('El email ya está registrado.');
    }

    const contrasenaHasheada = await bcrypt.hash(dto.contrasena, SALT_ROUNDS);

    const rol = await this.rolRepository.buscarPorNombre(dto.rol);
    if (!rol) {
      throw new NotFoundException(`Rol ${dto.rol} no encontrado.`);
    }

    const usuario = new Usuario();
    usuario.nombre = dto.nombre;
    usuario.email = dto.email;
    usuario.contrasena = contrasenaHasheada;
    usuario.rol = rol;

    const guardado = await this.usuarioRepository.guardar(usuario);
    return UsuarioMapper.aDto(guardado); // el mapper no devuelve la contraseña
  }
}
