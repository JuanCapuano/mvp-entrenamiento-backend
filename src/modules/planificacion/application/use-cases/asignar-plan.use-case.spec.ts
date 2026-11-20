import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlanRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/plan.repository-en-memoria';
import { UsuarioRepositorioEnMemoria } from '../../../../../test/repositorios-en-memoria/usuario.repositorio-en-memoria';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { PlanEntrenamiento } from '../../domain/entities/plan-entrenamiento.entity';
import { Rutina } from '../../domain/entities/rutina.entity';
import { PlanAsignado } from '../../domain/events/plan-asignado.event';
import { VerificadorSuperposicion } from '../../domain/services/verificador-superposicion.service';
import { Dosificacion } from '../../domain/value-objects/dosificacion.vo';
import { RangoRepeticiones } from '../../domain/value-objects/rango-repeticiones.vo';
import { AsignarPlanDto } from '../../dto/asignar-plan.dto';
import { AsignarPlanUseCase } from './asignar-plan.use-case';

// Datos del Paso 10: Laura (entrenadora) tiene a Juan y a Sofía; Sofía todavía no está vinculada
const LAURA = 1;
const MARTIN = 2;
const JUAN = 10;
const SOFIA = 11;

const deportista = (id: number, entrenadorId: number | null) =>
  Object.assign(new Usuario(), { id, entrenadorId });

const planDe = (entrenadorId: number, nombre: string) =>
  PlanEntrenamiento.crear(entrenadorId, nombre, null, [
    Rutina.crear('Piernas', [
      Dosificacion.crear(1, 1, 3, RangoRepeticiones.crear(8, 10), 2),
    ]),
  ]);

const dto = (cambios: Partial<AsignarPlanDto> = {}): AsignarPlanDto => ({
  deportista_id: JUAN,
  vigencia_desde: '2026-10-01',
  vigencia_hasta: '2026-11-30',
  ...cambios,
});

describe('AsignarPlanUseCase (US-08)', () => {
  let planes: PlanRepositoryEnMemoria;
  let eventEmitter: { emit: jest.Mock };
  let useCase: AsignarPlanUseCase;

  beforeEach(async () => {
    planes = new PlanRepositoryEnMemoria();
    await planes.guardar(planDe(LAURA, 'Fuerza')); // id 1
    await planes.guardar(planDe(LAURA, 'Fuerza 2')); // id 2
    eventEmitter = { emit: jest.fn() };
    useCase = new AsignarPlanUseCase(
      planes,
      new UsuarioRepositorioEnMemoria([
        deportista(JUAN, LAURA),
        deportista(SOFIA, null),
      ]),
      new VerificadorSuperposicion(),
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('asigna el plan al deportista vinculado con su vigencia', async () => {
    const respuesta = await useCase.execute(LAURA, 1, dto());

    expect(respuesta).toEqual({
      plan_id: 1,
      deportista_id: JUAN,
      vigencia_desde: '2026-10-01',
      vigencia_hasta: '2026-11-30',
    });
    expect(planes.planes[0].asignaciones).toHaveLength(1);
  });

  it('publica Plan asignado después de guardar', async () => {
    await useCase.execute(LAURA, 1, dto());

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      PlanAsignado.name,
      expect.objectContaining({
        planId: 1,
        deportistaId: JUAN,
        entrenadorId: LAURA,
        vigenciaDesde: '2026-10-01',
        vigenciaHasta: '2026-11-30',
      }),
    );
  });

  it('E9: rechaza una vigencia superpuesta con otro plan del deportista', async () => {
    await useCase.execute(LAURA, 1, dto());

    await expect(
      useCase.execute(
        LAURA,
        2,
        dto({ vigencia_desde: '2026-11-15', vigencia_hasta: '2026-12-15' }),
      ),
    ).rejects.toThrow(
      new DomainException('Se superpone con el plan vigente (01/10 al 30/11).'),
    );
    expect(planes.planes[1].asignaciones).toHaveLength(0);
  });

  it('rechaza una vigencia superpuesta con el mismo plan', async () => {
    await useCase.execute(LAURA, 1, dto());

    await expect(
      useCase.execute(LAURA, 1, dto({ vigencia_desde: '2026-11-01' })),
    ).rejects.toThrow('Se superpone con el plan vigente (01/10 al 30/11).');
  });

  it('acepta una vigencia que no se superpone con otras del deportista', async () => {
    await useCase.execute(LAURA, 1, dto());

    await expect(
      useCase.execute(
        LAURA,
        2,
        dto({ vigencia_desde: '2026-12-01', vigencia_hasta: '2026-12-31' }),
      ),
    ).resolves.toBeDefined();
  });

  it('E14: el mismo plan se asigna a otro deportista aunque otros ya lo hagan, cada uno con sus fechas', async () => {
    const usuarios = new UsuarioRepositorioEnMemoria([
      deportista(JUAN, LAURA),
      deportista(SOFIA, LAURA),
    ]);
    useCase = new AsignarPlanUseCase(
      planes,
      usuarios,
      new VerificadorSuperposicion(),
      eventEmitter as unknown as EventEmitter2,
    );
    await useCase.execute(LAURA, 1, dto());

    const respuesta = await useCase.execute(
      LAURA,
      1,
      dto({
        deportista_id: SOFIA,
        vigencia_desde: '2026-10-15',
        vigencia_hasta: '2026-12-15',
      }),
    );

    expect(respuesta.vigencia_desde).toBe('2026-10-15');
    expect(planes.planes[0].asignaciones.map((a) => a.deportistaId)).toEqual([
      JUAN,
      SOFIA,
    ]);
  });

  it('E11: rechaza a un deportista no vinculado con el entrenador (RN14)', async () => {
    await expect(
      useCase.execute(LAURA, 1, dto({ deportista_id: SOFIA })),
    ).rejects.toThrow(
      new DomainException('El deportista no está vinculado con vos.'),
    );
    expect(planes.planes[0].asignaciones).toHaveLength(0);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rechaza a un deportista vinculado con otro entrenador', async () => {
    await planes.guardar(planDe(MARTIN, 'Hipertrofia')); // id 3, de Martín; Juan es de Laura
    await expect(useCase.execute(MARTIN, 3, dto())).rejects.toThrow(
      'El deportista no está vinculado con vos.',
    );
  });

  it('rechaza una fecha de inicio posterior a la de fin (RN10)', async () => {
    await expect(
      useCase.execute(
        LAURA,
        1,
        dto({ vigencia_desde: '2026-12-01', vigencia_hasta: '2026-11-30' }),
      ),
    ).rejects.toThrow('La fecha de inicio no puede ser posterior a la de fin.');
  });

  it('404 si el plan no existe', async () => {
    await expect(useCase.execute(LAURA, 99, dto())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404 si el deportista no existe', async () => {
    await expect(
      useCase.execute(LAURA, 1, dto({ deportista_id: 999 })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 si el plan lo armó otro entrenador (RN17)', async () => {
    await expect(useCase.execute(MARTIN, 1, dto())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
