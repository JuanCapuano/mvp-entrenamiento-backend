import { MedicionRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/medicion.repository-en-memoria';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { MedicionCorporal } from '../../domain/entities/medicion-corporal.entity';
import { Altura } from '../../domain/value-objects/altura.vo';
import { PesoCorporal } from '../../domain/value-objects/peso-corporal.vo';
import { RegistrarMedicionUseCase } from './registrar-medicion.use-case';

// Datos del Paso 10: Juan y Sofía son deportistas; hoy es 21/10
const JUAN_ID = 3;
const SOFIA_ID = 4;
const HOY = '2026-10-21';
const AYER = '2026-10-20';

const medicion = (deportistaId: number, fecha: string, peso: number) =>
  MedicionCorporal.registrar(
    deportistaId,
    PesoCorporal.crear(peso),
    Altura.crear(1.76),
    fecha,
  );

describe('RegistrarMedicionUseCase (US-21)', () => {
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

  it('guarda el peso corporal y la altura con la fecha del día y devuelve id y fecha', async () => {
    const respuesta = await useCase.execute(JUAN_ID, {
      peso_corporal: 78.4,
      altura: 1.76,
    });

    expect(respuesta).toEqual({ id: 1, fecha: HOY });
    expect(repositorio.mediciones).toHaveLength(1);
    const guardada = repositorio.mediciones[0];
    expect(guardada.deportistaId).toBe(JUAN_ID);
    expect(guardada.fecha).toBe(HOY);
    expect(guardada.pesoCorporal.valor).toBe(78.4);
    expect(guardada.altura.valor).toBe(1.76);
  });

  it('usa la fecha de Argentina aunque en UTC ya sea el día siguiente', async () => {
    jest.setSystemTime(new Date(`${HOY}T23:30:00-03:00`));

    const respuesta = await useCase.execute(JUAN_ID, {
      peso_corporal: 78.4,
      altura: 1.76,
    });

    expect(respuesta.fecha).toBe(HOY);
  });

  it('si ya cargó una medición hoy, la reemplaza en lugar de crear otra (RN19)', async () => {
    const primera = await useCase.execute(JUAN_ID, {
      peso_corporal: 78.4,
      altura: 1.76,
    });
    const segunda = await useCase.execute(JUAN_ID, {
      peso_corporal: 77.9,
      altura: 1.77,
    });

    expect(segunda).toEqual(primera);
    expect(repositorio.mediciones).toHaveLength(1);
    expect(repositorio.mediciones[0].pesoCorporal.valor).toBe(77.9);
    expect(repositorio.mediciones[0].altura.valor).toBe(1.77);
  });

  it('la medición de otro día no se toca: se crea una nueva', async () => {
    repositorio = new MedicionRepositoryEnMemoria([
      medicion(JUAN_ID, AYER, 78.4),
    ]);
    useCase = new RegistrarMedicionUseCase(repositorio);

    await useCase.execute(JUAN_ID, { peso_corporal: 78, altura: 1.76 });

    expect(repositorio.mediciones).toHaveLength(2);
    const deAyer = repositorio.mediciones.find((m) => m.fecha === AYER);
    expect(deAyer?.pesoCorporal.valor).toBe(78.4);
  });

  it('la medición de hoy de otro deportista no se reemplaza', async () => {
    repositorio = new MedicionRepositoryEnMemoria([
      medicion(SOFIA_ID, HOY, 60),
    ]);
    useCase = new RegistrarMedicionUseCase(repositorio);

    await useCase.execute(JUAN_ID, { peso_corporal: 78.4, altura: 1.76 });

    expect(repositorio.mediciones).toHaveLength(2);
    const deSofia = repositorio.mediciones.find(
      (m) => m.deportistaId === SOFIA_ID,
    );
    expect(deSofia?.pesoCorporal.valor).toBe(60);
  });

  it.each([0, -5])(
    'rechaza un peso corporal de %p y no guarda nada (RN19)',
    async (peso_corporal) => {
      await expect(
        useCase.execute(JUAN_ID, { peso_corporal, altura: 1.76 }),
      ).rejects.toThrow(
        new DomainException('El peso corporal tiene que ser mayor a 0.'),
      );
      expect(repositorio.mediciones).toHaveLength(0);
    },
  );

  it.each([0, -1.76])(
    'rechaza una altura de %p y no guarda nada (RN19)',
    async (altura) => {
      await expect(
        useCase.execute(JUAN_ID, { peso_corporal: 78.4, altura }),
      ).rejects.toThrow(
        new DomainException('La altura tiene que ser mayor a 0.'),
      );
      expect(repositorio.mediciones).toHaveLength(0);
    },
  );

  it('si la medición nueva es inválida, la que ya estaba cargada hoy queda igual', async () => {
    await useCase.execute(JUAN_ID, { peso_corporal: 78.4, altura: 1.76 });

    await expect(
      useCase.execute(JUAN_ID, { peso_corporal: 0, altura: 1.76 }),
    ).rejects.toThrow(DomainException);

    expect(repositorio.mediciones[0].pesoCorporal.valor).toBe(78.4);
  });
});
