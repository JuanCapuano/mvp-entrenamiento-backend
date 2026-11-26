import { BuscarSesionesQuery } from '../queries/buscar-sesiones.query';
import { BuscarSesionesDto } from '../../dto/buscar-sesiones.dto';

// Traduce los filtros de la URL (BuscarSesionesDto) al Query del módulo (BuscarSesionesQuery)
// y le suma lo que no viene del cliente: el deportista del token (RN17).
export class BuscarSesionesQueryFactory {
  static crear(
    deportistaId: number,
    dto: BuscarSesionesDto,
  ): BuscarSesionesQuery {
    return {
      deportistaId,
      desde: dto.desde,
      hasta: dto.hasta,
    };
  }
}
