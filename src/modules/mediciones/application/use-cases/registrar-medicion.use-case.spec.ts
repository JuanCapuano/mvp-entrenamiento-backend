import { MedicionRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/medicion.repository-en-memoria';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { RegistrarMedicionUseCase } from './registrar-medicion.use-case';

// Datos del Paso 10: Juan es deportista; hoy es 21/10
const JUAN_ID = 3;
const HOY = '2026-10-21';

describe('RegistrarMedicionUseCase (US-21, RN19)', () => {
  let repositorio: MedicionRepositoryEnMemoria;
  let useCase: RegistrarMedicionUseCase;

  beforeEach(() => {
    // La fecha del día sale del reloj del servidor: se fija al mediodía de Argentina
    jest.useFakeTimers().setSystemTime(new Date(`${HOY}T12:00:00-03:00`));
    repositorio = new MedicionRepositoryEnMemoria();
    useCase = new RegistrarMedicionUseCase(repositorio);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('si ya cargó una medición hoy, la reemplaza en lugar de crear otra', async () => {
    await useCase.execute(JUAN_ID, { peso_corporal: 78.4, altura: 1.76 });
    await useCase.execute(JUAN_ID, { peso_corporal: 77.9, altura: 1.77 });

    expect(repositorio.mediciones).toHaveLength(1);
    expect(repositorio.mediciones[0].pesoCorporal.valor).toBe(77.9);
    expect(repositorio.mediciones[0].altura.valor).toBe(1.77);
  });

  it('rechaza un peso corporal de 0 y no guarda nada', async () => {
    await expect(
      useCase.execute(JUAN_ID, { peso_corporal: 0, altura: 1.76 }),
    ).rejects.toThrow(
      new DomainException('El peso corporal tiene que ser mayor a 0.'),
    );
    expect(repositorio.mediciones).toHaveLength(0);
  });
});
