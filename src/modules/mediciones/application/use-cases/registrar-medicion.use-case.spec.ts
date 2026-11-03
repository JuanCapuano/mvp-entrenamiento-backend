jest.mock('@nestjs/common', () => ({
  Injectable: () => (target: any) => target,
  Inject: () => (_target: any, _key: any, _index: any) => {},
}));

import { RegistrarMedicionUseCase } from './registrar-medicion.use-case';
import { MedicionRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/medicion.repository-en-memoria';

describe('RegistrarMedicionUseCase (US-21, RN19)', () => {
  let useCase: RegistrarMedicionUseCase;
  let repo: MedicionRepositoryEnMemoria;

  beforeEach(() => {
    repo = new MedicionRepositoryEnMemoria();
    useCase = new RegistrarMedicionUseCase(repo);
  });

  it('debe registrar una medición nueva para el deportista en la fecha', async () => {
    const res = await useCase.execute(
      10,
      { peso_corporal: 74.5, altura: 1.8 },
      '2026-10-21',
    );

    expect(res).toBeDefined();
    expect(res.id).toBe(1);
    expect(res.fecha).toBe('2026-10-21');

    const enRepo = await repo.buscarDelDia(10, '2026-10-21');
    expect(enRepo).not.toBeNull();
    expect(enRepo?.pesoCorporal).toBe(74.5);
    expect(enRepo?.altura).toBe(1.8);
  });

  it('debe reemplazar la medición del mismo día si ya existe (RN19)', async () => {
    // Primera carga del día
    const res1 = await useCase.execute(
      10,
      { peso_corporal: 74.5, altura: 1.8 },
      '2026-10-21',
    );

    // Segunda carga del mismo día con otros valores
    const res2 = await useCase.execute(
      10,
      { peso_corporal: 75.0, altura: 1.8 },
      '2026-10-21',
    );

    // Mismo id y fecha
    expect(res2.id).toBe(res1.id);
    expect(res2.fecha).toBe('2026-10-21');

    // Solo debe haber 1 medición en el repo para ese deportista
    expect(repo.items.length).toBe(1);
    expect(repo.items[0].pesoCorporal).toBe(75.0);
  });

  it('debe rechazar con error si el peso corporal es 0 o menor (RN19)', async () => {
    await expect(
      useCase.execute(10, { peso_corporal: 0, altura: 1.8 }, '2026-10-21'),
    ).rejects.toThrow('El peso corporal tiene que ser mayor a 0.');

    await expect(
      useCase.execute(10, { peso_corporal: -5, altura: 1.8 }, '2026-10-21'),
    ).rejects.toThrow('El peso corporal tiene que ser mayor a 0.');
  });

  it('debe rechazar con error si la altura es 0 o menor (RN19)', async () => {
    await expect(
      useCase.execute(10, { peso_corporal: 70, altura: 0 }, '2026-10-21'),
    ).rejects.toThrow('La altura tiene que ser mayor a 0.');

    await expect(
      useCase.execute(10, { peso_corporal: 70, altura: -1.7 }, '2026-10-21'),
    ).rejects.toThrow('La altura tiene que ser mayor a 0.');
  });
});
