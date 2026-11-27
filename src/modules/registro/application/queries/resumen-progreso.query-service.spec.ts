import { SesionEntrenamientoRepositoryEnMemoria } from '../../../../../test/repositorios-en-memoria/sesion-entrenamiento.repository-en-memoria';
import { SesionEntrenamientoFactory } from '../../domain/factories/sesion-entrenamiento.factory';
import { CalculadoraResumen } from '../../domain/services/calculadora-resumen.service';
import { DetectorRecordPersonal } from '../../domain/services/detector-record-personal.service';
import { Peso } from '../../domain/value-objects/peso.vo';
import { Repeticiones } from '../../domain/value-objects/repeticiones.vo';
import { RIR } from '../../domain/value-objects/rir.vo';
import { ResumenProgresoQueryService } from './resumen-progreso-query.service';

const JUAN = 3;
const SOFIA = 4;
const PLAN = 1;
const PIERNAS = 10;
const TORSO = 11;
const SENTADILLA = 1;
const PRESS_BANCA = 4;
const HOY = '2026-10-21'; // miércoles: la semana va del 19 al 25/10

type DatosSerie = [ejercicioId: number, peso: number, repeticiones: number];

describe('ResumenProgresoQueryService.buscarResumen', () => {
  let sesiones: SesionEntrenamientoRepositoryEnMemoria;
  let servicio: ResumenProgresoQueryService;

  async function guardarSesion(
    deportistaId: number,
    rutinaId: number,
    fecha: string,
    series: DatosSerie[],
  ) {
    const vo = ([, peso, repeticiones]: DatosSerie) =>
      [
        Peso.crear(peso),
        Repeticiones.crear(repeticiones),
        RIR.crear(2),
      ] as const;
    const [primera, ...resto] = series;
    const sesion = new SesionEntrenamientoFactory().crear(
      deportistaId,
      PLAN,
      rutinaId,
      fecha,
      primera[0],
      ...vo(primera),
    );
    for (const serie of resto) {
      sesion.registrarSerie(deportistaId, fecha, serie[0], ...vo(serie));
    }
    await sesiones.guardar(sesion);
  }

  beforeEach(() => {
    sesiones = new SesionEntrenamientoRepositoryEnMemoria();
    servicio = new ResumenProgresoQueryService(
      sesiones,
      new CalculadoraResumen(),
      new DetectorRecordPersonal(),
      () => HOY,
    );
  });

  it('Paso 10: récords, volumen de esta semana y de la anterior, sesiones y series', async () => {
    await guardarSesion(JUAN, PIERNAS, '2026-10-14', [
      [SENTADILLA, 60, 8],
      [SENTADILLA, 60, 8],
      [SENTADILLA, 60, 8],
    ]);
    await guardarSesion(JUAN, PIERNAS, HOY, [[SENTADILLA, 65, 8]]);
    await guardarSesion(JUAN, TORSO, HOY, [[PRESS_BANCA, 50, 10]]);

    expect(await servicio.buscarResumen(JUAN)).toEqual({
      desde: '2026-10-19',
      hasta: '2026-10-25',
      records: 1,
      volumen: 1020,
      volumen_anterior: 1440,
      sesiones: 2,
      series: 2,
    });
  });

  it('mide los récords en el orden en que se registraron, aunque el repositorio devuelva primero lo más reciente', async () => {
    // 60 × 8 el 07/10 y 65 × 8 hoy: el de hoy supera al anterior, así que es récord de esta semana
    await guardarSesion(JUAN, PIERNAS, '2026-10-07', [[SENTADILLA, 60, 8]]);
    await guardarSesion(JUAN, PIERNAS, HOY, [[SENTADILLA, 65, 8]]);

    const resumen = await servicio.buscarResumen(JUAN);

    expect(resumen.records).toBe(1);
  });

  it('RN17: solo cuenta las series del deportista del token', async () => {
    await guardarSesion(SOFIA, PIERNAS, HOY, [[SENTADILLA, 100, 5]]);

    const resumen = await servicio.buscarResumen(JUAN);

    expect(resumen.series).toBe(0);
    expect(resumen.volumen).toBe(0);
  });
});
