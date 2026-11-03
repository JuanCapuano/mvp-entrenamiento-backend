import { MedicionCorporal } from './medicion-corporal.entity';
import { PesoCorporal } from '../value-objects/peso-corporal.vo';
import { Altura } from '../value-objects/altura.vo';

describe('MedicionCorporal Entity (RN19)', () => {
  it('debe crear una medición con sus atributos', () => {
    const peso = new PesoCorporal(70.2);
    const altura = new Altura(1.75);
    const medicion = MedicionCorporal.crear(1, '2026-10-21', peso, altura);

    expect(medicion.deportistaId).toBe(1);
    expect(medicion.fecha).toBe('2026-10-21');
    expect(medicion.pesoCorporal).toBe(70.2);
    expect(medicion.altura).toBe(1.75);
  });

  it('debe actualizar peso y altura al sobreescribir la medición del día (RN19)', () => {
    const pesoInicial = new PesoCorporal(70.2);
    const alturaInicial = new Altura(1.75);
    const medicion = MedicionCorporal.crear(
      1,
      '2026-10-21',
      pesoInicial,
      alturaInicial,
    );

    const nuevoPeso = new PesoCorporal(71.0);
    const nuevaAltura = new Altura(1.76);
    medicion.actualizar(nuevoPeso, nuevaAltura);

    expect(medicion.pesoCorporal).toBe(71.0);
    expect(medicion.altura).toBe(1.76);
    expect(medicion.fecha).toBe('2026-10-21');
  });
});
