import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Vigencia } from '../value-objects/vigencia.vo';
import { VerificadorSuperposicion } from './verificador-superposicion.service';

describe('VerificadorSuperposicion (RN11)', () => {
  const verificador = new VerificadorSuperposicion();
  // Datos del Paso 10 (E9): Juan tiene un plan del 01/10 al 30/11
  const vigenteDeJuan = Vigencia.crear('2026-10-01', '2026-11-30');

  it('E9: rechaza una vigencia que se superpone, con las fechas del plan vigente', () => {
    const nueva = Vigencia.crear('2026-11-15', '2026-12-15');

    expect(() => verificador.verificar(nueva, [vigenteDeJuan])).toThrow(
      new DomainException('Se superpone con el plan vigente (01/10 al 30/11).'),
    );
  });

  it('acepta una vigencia que empieza el día siguiente', () => {
    const nueva = Vigencia.crear('2026-12-01', '2026-12-31');

    expect(() => verificador.verificar(nueva, [vigenteDeJuan])).not.toThrow();
  });

  it('acepta cualquier vigencia si el deportista no tiene asignaciones', () => {
    const nueva = Vigencia.crear('2026-11-15', '2026-12-15');

    expect(() => verificador.verificar(nueva, [])).not.toThrow();
  });

  it('compara contra todas las asignaciones, aunque sean de planes distintos', () => {
    const anterior = Vigencia.crear('2026-08-01', '2026-09-30');
    const nueva = Vigencia.crear('2026-09-15', '2026-10-15');

    expect(() =>
      verificador.verificar(nueva, [anterior, vigenteDeJuan]),
    ).toThrow('Se superpone con el plan vigente (01/08 al 30/09).');
  });
});
