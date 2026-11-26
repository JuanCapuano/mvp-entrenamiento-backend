// Criterios de búsqueda de las sesiones de un deportista (US-20).
// Lo arma BuscarSesionesQueryFactory y viaja del QueryService al repositorio.
export class BuscarSesionesQuery {
  // Del token, nunca del cliente (RN17: el deportista solo ve sus sesiones)
  deportistaId: number;
  // 'YYYY-MM-DD', extremos incluidos. Sin fecha, no se filtra por ese lado.
  desde?: string;
  hasta?: string;
}
