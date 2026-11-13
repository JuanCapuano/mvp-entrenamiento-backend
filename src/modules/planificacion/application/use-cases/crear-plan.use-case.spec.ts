import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EjercicioRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/ejercicio.repository-en-memoria';
import { PlanRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/plan.repository-en-memoria';
import { Ejercicio } from '../../../catalogo/domain/entities/ejercicio.entity';
import { DomainException } from '../../../common/exceptions/domain-exceptions';
import { PlanCreado } from '../../domain/events/plan-creado.event';
import { CrearPlanDto, DosificacionDto } from '../../dto/crear-plan.dto';
import { CrearPlanUseCase } from './crear-plan.use-case';

const ejercicio = (id: number) => Object.assign(new Ejercicio(), { id });

const dosificacion = (
  cambios: Partial<DosificacionDto> = {},
): DosificacionDto => ({
  ejercicio_id: 1,
  orden: 1,
  series_objetivo: 3,
  reps_min: 8,
  reps_max: 10,
  rir_objetivo: 2,
  ...cambios,
});

const planFuerza = (): CrearPlanDto => ({
  nombre: 'Fuerza',
  rutinas: [
    {
      nombre: 'Piernas',
      dosificaciones: [
        dosificacion({ ejercicio_id: 1, orden: 1 }),
        dosificacion({ ejercicio_id: 2, orden: 2 }),
      ],
    },
    {
      nombre: 'Torso',
      dosificaciones: [
        dosificacion({ ejercicio_id: 3, orden: 1 }),
        dosificacion({ ejercicio_id: 4, orden: 2 }),
      ],
    },
  ],
});

describe('CrearPlanUseCase', () => {
  let planes: PlanRepositoryEnMemoria;
  let eventEmitter: { emit: jest.Mock };
  let useCase: CrearPlanUseCase;

  beforeEach(() => {
    planes = new PlanRepositoryEnMemoria();
    eventEmitter = { emit: jest.fn() };
    useCase = new CrearPlanUseCase(
      planes,
      new EjercicioRepositoryEnMemoria([1, 2, 3, 4].map(ejercicio)),
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('guarda el plan sin asignarlo y devuelve su id', async () => {
    const respuesta = await useCase.execute(10, planFuerza());

    expect(respuesta).toEqual({ id: 1 });
    expect(planes.planes).toHaveLength(1);
    expect(planes.planes[0].entrenadorId).toBe(10);
    expect(planes.planes[0].rutinas).toHaveLength(2);
  });

  it('publica Plan creado después de guardar', async () => {
    await useCase.execute(10, planFuerza());

    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    const [nombre, evento] = eventEmitter.emit.mock.calls[0];
    expect(nombre).toBe('PlanCreado');
    expect(evento).toBeInstanceOf(PlanCreado);
    expect(evento.planId).toBe(1);
    expect(evento.entrenadorId).toBe(10);
    expect(evento.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('acepta indicaciones opcionales', async () => {
    await useCase.execute(10, {
      ...planFuerza(),
      indicaciones: 'Entrada en calor',
    });
    expect(planes.planes[0].indicaciones).toBe('Entrada en calor');
  });

  it('responde 404 si un ejercicio no está en el catálogo y no guarda nada', async () => {
    const dto = planFuerza();
    dto.rutinas[0].dosificaciones[1].ejercicio_id = 999;

    await expect(useCase.execute(10, dto)).rejects.toThrow(NotFoundException);
    expect(planes.planes).toHaveLength(0);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('el dominio rechaza el ejercicio repetido en una rutina (RN15) y no guarda ni publica', async () => {
    const dto = planFuerza();
    dto.rutinas[0].dosificaciones[1].ejercicio_id = 1;

    await expect(useCase.execute(10, dto)).rejects.toThrow(
      new DomainException(
        'El ejercicio no puede repetirse dentro de la rutina.',
      ),
    );
    expect(planes.planes).toHaveLength(0);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('el dominio rechaza un plan sin rutinas (RN10)', async () => {
    await expect(
      useCase.execute(10, { nombre: 'Fuerza', rutinas: [] }),
    ).rejects.toThrow(DomainException);
  });
});
