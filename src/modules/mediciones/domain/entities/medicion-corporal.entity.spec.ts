import { Altura } from '../value-objects/altura.vo';
import { PesoCorporal } from '../value-objects/peso-corporal.vo';
import { MedicionCorporal } from './medicion-corporal.entity';

const JUAN_ID = 3;
const HOY = '2026-10-21';

describe('MedicionCorporal (US-21, RN19)', () => {
  it('se registra con el peso corporal, la altura y la fecha del día', () => {
    const medicion = MedicionCorporal.registrar(
      JUAN_ID,
      PesoCorporal.crear(78.4),
      Altura.crear(1.76),
      HOY,
    );

    expect(medicion.deportistaId).toBe(JUAN_ID);
    expect(medicion.fecha).toBe(HOY);
    expect(medicion.pesoCorporal.valor).toBe(78.4);
    expect(medicion.altura.valor).toBe(1.76);
  });

  it('al reemplazarla cambian el peso corporal y la altura, no el deportista ni la fecha', () => {
    const medicion = MedicionCorporal.registrar(
      JUAN_ID,
      PesoCorporal.crear(78.4),
      Altura.crear(1.76),
      HOY,
    );

    medicion.reemplazar(PesoCorporal.crear(77.9), Altura.crear(1.77));

    expect(medicion.pesoCorporal.valor).toBe(77.9);
    expect(medicion.altura.valor).toBe(1.77);
    expect(medicion.deportistaId).toBe(JUAN_ID);
    expect(medicion.fecha).toBe(HOY);
  });
});
