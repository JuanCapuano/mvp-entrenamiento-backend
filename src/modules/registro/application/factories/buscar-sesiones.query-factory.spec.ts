import { BuscarSesionesQueryFactory } from './buscar-sesiones.query-factory';

describe('BuscarSesionesQueryFactory (US-20)', () => {
  it('arma el query con el deportista del token y el rango de fechas de la URL', () => {
    expect(
      BuscarSesionesQueryFactory.crear(3, {
        desde: '2026-10-01',
        hasta: '2026-10-31',
      }),
    ).toEqual({ deportistaId: 3, desde: '2026-10-01', hasta: '2026-10-31' });
  });

  it('sin filtros en la URL, el query solo lleva el deportista', () => {
    expect(BuscarSesionesQueryFactory.crear(3, {})).toEqual({
      deportistaId: 3,
      desde: undefined,
      hasta: undefined,
    });
  });
});
