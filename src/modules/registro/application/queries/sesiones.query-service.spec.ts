import { EjercicioRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/ejercicio.repository-en-memoria';
import { PlanRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/plan.repository-en-memoria';
import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import {
  Ejercicio,
  GrupoMuscular,
} from '../../../catalogo/domain/entities/ejercicio.entity';
import { PlanEntrenamientoFactory } from '../../../planificacion/domain/factories/plan-entrenamiento.factory';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { CalculadoraCumplimiento } from '../../domain/services/calculadora-cumplimiento.service';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { SesionesQueryService } from './sesiones-query.service';

const JUAN = 3;
const SOFIA = 4;
const SENTADILLA = 1;
const PRESS_BANCA = 4;

// Plan con dos rutinas: Piernas (Sentadilla, 3 series) y Torso (Press de banca, 3 series)
function planFuerza(id: number, rutinaIds: [number, number]) {
  const plan = PlanEntrenamientoFactory.crear(9, {
    nombre: `Plan ${id}`,
    rutinas: [
      {
        nombre: 'Piernas',
        dosificaciones: [
          {
            ejercicioId: SENTADILLA,
            orden: 1,
            seriesObjetivo: 3,
            repsMin: 8,
            repsMax: 10,
            rirObjetivo: 2,
          },
        ],
      },
      {
        nombre: 'Torso',
        dosificaciones: [
          {
            ejercicioId: PRESS_BANCA,
            orden: 1,
            seriesObjetivo: 3,
            repsMin: 8,
            repsMax: 10,
            rirObjetivo: 2,
          },
        ],
      },
    ],
  });
  plan.id = id;
  plan.rutinas.forEach((rutina, i) => (rutina.id = rutinaIds[i]));
  return plan;
}

const ejercicio = (id: number, nombre: string) =>
  Object.assign(new Ejercicio(), {
    id,
    nombre,
    grupoMuscular: GrupoMuscular.PIERNA,
  });

describe('SesionesQueryService.buscarSesiones (US-20)', () => {
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let servicio: SesionesQueryService;

  // Guarda una sesión con una serie por ejercicio indicado (60 kg × 8, RIR 2)
  async function guardarSesion(
    deportistaId: number,
    planId: number,
    rutinaId: number,
    fecha: string,
    ...ejercicios: number[]
  ) {
    const valores = [
      Peso.crear(60),
      Repeticiones.crear(8),
      RIR.crear(2),
    ] as const;
    const [primero, ...resto] = ejercicios;
    const sesion = new SesionEntrenamientoFactory().crear(
      deportistaId,
      planId,
      rutinaId,
      fecha,
      primero,
      ...valores,
    );
    for (const ejercicioId of resto) {
      sesion.registrarSerie(deportistaId, fecha, ejercicioId, ...valores);
    }
    await sesiones.guardar(sesion);
  }

  beforeEach(() => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    const planes = new PlanRepositoryEnMemoria();
    // Plan 1 ya terminó; el plan 2 es el vigente
    planes.planes.push(planFuerza(1, [10, 11]), planFuerza(2, [20, 21]));
    servicio = new SesionesQueryService(
      {} as never,
      {} as never,
      () => '2026-10-21',
      planes,
      new CalculadoraCumplimiento(),
      sesiones,
      new EjercicioRepositoryEnMemoria([
        ejercicio(SENTADILLA, 'Sentadilla'),
        ejercicio(PRESS_BANCA, 'Press de banca'),
      ]),
    );
  });

  it('devuelve las sesiones de la más reciente a la más antigua, aunque sean de planes distintos', async () => {
    await guardarSesion(JUAN, 1, 10, '2026-09-20', SENTADILLA);
    await guardarSesion(JUAN, 2, 21, '2026-10-14', PRESS_BANCA);
    await guardarSesion(JUAN, 2, 20, '2026-10-07', SENTADILLA, SENTADILLA);

    const resultado = await servicio.buscarSesiones({ deportistaId: JUAN });

    expect(
      resultado.map(({ fecha, rutina, cumplimiento }) => ({
        fecha,
        rutina,
        cumplimiento,
      })),
    ).toEqual([
      { fecha: '2026-10-14', rutina: 'Torso', cumplimiento: 33 },
      { fecha: '2026-10-07', rutina: 'Piernas', cumplimiento: 67 },
      { fecha: '2026-09-20', rutina: 'Piernas', cumplimiento: 33 },
    ]);
    expect(resultado[1].ejercicios).toEqual([
      {
        nombre: 'Sentadilla',
        cumplimiento: 67,
        series: [
          { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
          { numero: 2, peso: 60, repeticiones: 8, rir: 2 },
        ],
      },
    ]);
  });

  it('dos sesiones el mismo día (doble turno): primero la que se empezó última', async () => {
    await guardarSesion(JUAN, 2, 20, '2026-10-14', SENTADILLA);
    await guardarSesion(JUAN, 2, 21, '2026-10-14', PRESS_BANCA);

    const resultado = await servicio.buscarSesiones({ deportistaId: JUAN });

    expect(resultado.map((sesion) => sesion.rutina)).toEqual([
      'Torso',
      'Piernas',
    ]);
  });

  it('filtra por rango de fechas, con los extremos incluidos', async () => {
    await guardarSesion(JUAN, 2, 20, '2026-10-01', SENTADILLA);
    await guardarSesion(JUAN, 2, 20, '2026-10-07', SENTADILLA);
    await guardarSesion(JUAN, 2, 20, '2026-10-14', SENTADILLA);
    await guardarSesion(JUAN, 2, 20, '2026-10-21', SENTADILLA);

    const resultado = await servicio.buscarSesiones({
      deportistaId: JUAN,
      desde: '2026-10-07',
      hasta: '2026-10-14',
    });

    expect(resultado.map((sesion) => sesion.fecha)).toEqual([
      '2026-10-14',
      '2026-10-07',
    ]);
  });

  it('el deportista solo ve sus propias sesiones (RN17)', async () => {
    await guardarSesion(SOFIA, 2, 20, '2026-10-14', SENTADILLA);
    await guardarSesion(JUAN, 2, 21, '2026-10-14', PRESS_BANCA);

    const resultado = await servicio.buscarSesiones({ deportistaId: JUAN });

    expect(resultado.map((sesion) => sesion.rutina)).toEqual(['Torso']);
  });

  it('sin sesiones en el rango, devuelve una lista vacía', async () => {
    await guardarSesion(JUAN, 2, 20, '2026-10-14', SENTADILLA);

    await expect(
      servicio.buscarSesiones({ deportistaId: JUAN, desde: '2026-10-15' }),
    ).resolves.toEqual([]);
  });
});
