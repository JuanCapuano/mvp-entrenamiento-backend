// Simula ~2 meses de uso real: planes del entrenador, sesiones/series del deportista y peso corporal.
// Inserta directo en MySQL (la API no deja cargar fechas pasadas: "hoy" lo pone el servidor, RN12).
//
// Uso (desde la raíz del backend):
//   node scripts/simular-historial.cjs            -> carga la simulación
//   node scripts/simular-historial.cjs --limpiar  -> borra SOLO lo que insertó este script
//
// No toca los datos cargados a mano: guarda los ids que crea en scripts/.simulacion-manifiesto.json.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const MANIFIESTO = path.join(__dirname, '.simulacion-manifiesto.json');

const env = {};
for (const l of fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const mysql = require(path.join(RAIZ, 'node_modules/mysql2/promise'));

const ENTRENADOR_EMAIL = 'entrenador1@gmail.com';
const DEPORTISTA_EMAIL = 'deportista1@gmail.com';
const HOY = '2026-11-26'; // el día que se corrió la simulación; hoy queda vacío para registrar a mano
const ALTURA = 1.76;

// ---------- utilidades ----------
let semilla = 20261126;
function azar() {
  // mulberry32: determinista, así la simulación sale igual cada vez
  semilla |= 0;
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (a, b) => a + (b - a) * azar();
const entero = (a, b) => Math.floor(entre(a, b + 1));
const ruido = (amp) => entre(-amp, amp);
const limitar = (x, a, b) => Math.min(Math.max(x, a), b);

const aFecha = (d) => d.toISOString().slice(0, 10);
const parsear = (s) => new Date(`${s}T00:00:00Z`);
const sumarDias = (s, n) => aFecha(new Date(parsear(s).getTime() + n * 86400000));
const diaSemana = (s) => parsear(s).getUTCDay(); // 0 dom … 6 sáb
const diasEntre = (a, b) => Math.round((parsear(b) - parsear(a)) / 86400000);
function* rango(desde, hasta) {
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) yield f;
}
const redondear = (x, paso) => Math.round(x / paso) * paso;

// ---------- definición de los planes ----------
// ejercicio_id, series, [rep_min, rep_max], rir objetivo, 1RM estimado inicial (kg)
const E1RM = {
  1: 115, 10: 220, 11: 55, 14: 130, 15: 120, 21: 100, 23: 45, 25: 45, 33: 24, 35: 85, 36: 75, 42: 80,
  48: 50, 55: 50, 59: 78, 60: 85, 61: 90, 62: 34, 65: 28, 66: 35, 67: 60, 70: 55, 9: 50, 16: 110, 18: 30,
};

// Dos meses previos (27/07 al 27/09): arranca más liviano, así el progreso se ve desde el principio
const PLAN_0 = {
  nombre: 'Adaptación general',
  indicaciones:
    'Primeras 4 semanas: cuerpo completo, cargas moderadas y repeticiones altas para aprender los movimientos. Dejar 3 repeticiones en reserva.',
  desde: '2026-07-27',
  hasta: '2026-08-23',
  dias: [1, 3, 5],
  rutinas: [
    { nombre: 'Cuerpo completo A', ej: [[1, 3, [12, 15], 3], [61, 3, [12, 15], 3], [35, 3, [12, 15], 3], [70, 3, [12, 15], 3]] },
    { nombre: 'Cuerpo completo B', ej: [[10, 3, [12, 15], 3], [62, 3, [12, 15], 3], [42, 3, [12, 15], 3], [25, 3, [12, 15], 3], [55, 3, [12, 15], 3]] },
    { nombre: 'Cuerpo completo C', ej: [[14, 3, [10, 12], 3], [59, 3, [12, 15], 3], [36, 3, [12, 15], 3], [15, 3, [12, 15], 3], [21, 3, [12, 15], 3]] },
  ],
};

const PLAN_00 = {
  nombre: 'Volumen - Base',
  indicaciones:
    'Se sube el volumen y se baja el RIR. Semana 5 de descarga (menos carga) antes de pasar al bloque de hipertrofia.',
  desde: '2026-08-24',
  hasta: '2026-09-27',
  dias: [1, 3, 5],
  rutinas: [
    { nombre: 'Pecho y espalda', ej: [[61, 4, [10, 12], 2], [35, 4, [10, 12], 2], [62, 3, [10, 12], 2], [42, 3, [10, 12], 2]] },
    { nombre: 'Pierna', ej: [[1, 4, [10, 12], 2], [10, 4, [12, 15], 2], [11, 3, [10, 12], 2], [15, 3, [10, 12], 2], [21, 3, [15, 15], 1]] },
    { nombre: 'Hombro y brazos', ej: [[70, 4, [10, 12], 2], [48, 3, [10, 12], 2], [55, 3, [12, 15], 2], [25, 3, [10, 12], 2], [33, 3, [12, 15], 2]] },
  ],
};

const PLAN_A = {
  nombre: 'Hipertrofia - Bloque 1',
  indicaciones:
    'Bloque de acumulación: 3 días por semana, rango de 8 a 15 repeticiones. Descanso de 90 s entre series. Semana 4 de descarga.',
  desde: '2026-09-28',
  hasta: '2026-10-25',
  dias: [1, 3, 5], // lun, mié, vie → rutinas 1, 2, 3
  rutinas: [
    { nombre: 'Pecho y tríceps', ej: [[61, 4, [8, 10], 2], [62, 3, [10, 12], 2], [67, 3, [12, 15], 1], [55, 3, [10, 12], 1], [48, 3, [10, 12], 2]] },
    { nombre: 'Espalda y bíceps', ej: [[35, 4, [8, 10], 2], [42, 3, [10, 12], 2], [36, 3, [10, 12], 2], [25, 3, [10, 12], 1], [33, 3, [12, 15], 1]] },
    { nombre: 'Pierna', ej: [[1, 4, [8, 10], 2], [10, 3, [10, 12], 2], [11, 3, [10, 12], 1], [15, 3, [8, 10], 2], [21, 4, [12, 15], 1]] },
  ],
};

const PLAN_B = {
  nombre: 'Fuerza - Bloque 2',
  indicaciones:
    'Bloque de fuerza: ejercicios básicos con 3 a 8 repeticiones y descansos largos (2-3 min). Priorizar técnica sobre carga.',
  desde: '2026-10-26',
  hasta: '2026-11-14',
  dias: [1, 3, 5],
  rutinas: [
    { nombre: 'Empuje', ej: [[61, 5, [3, 5], 2], [70, 4, [4, 6], 2], [59, 3, [6, 8], 2]] },
    { nombre: 'Tirón', ej: [[14, 4, [3, 5], 2], [35, 4, [5, 6], 2], [42, 3, [6, 8], 2], [23, 3, [6, 8], 1]] },
    { nombre: 'Pierna', ej: [[1, 5, [3, 5], 2], [10, 3, [6, 8], 2], [15, 3, [6, 8], 2], [11, 3, [8, 10], 1]] },
  ],
};

// ---------- simulación de una sesión ----------
const nivel1RM = {}; // 1RM actual por ejercicio, se mantiene entre planes
const semanaInicio = '2026-09-28';

function actualizar1RM(ejercicioId, fecha) {
  // progreso lento y sostenido (~1,2 % por semana) con ruido
  const semanas = diasEntre(semanaInicio, fecha) / 7;
  const base = E1RM[ejercicioId] * (1 + 0.012 * semanas);
  nivel1RM[ejercicioId] = base;
  return base;
}

function simularSesion(plan, rutina, fecha, factorCarga) {
  const series = [];
  const ejercicios = [...rutina.ej];
  // A veces se corta la sesión y se omite el último ejercicio
  if (azar() < 0.1 && ejercicios.length > 3) ejercicios.pop();

  for (const [ejId, nSeries, [rMin, rMax], rirObj] of ejercicios) {
    const e1rm = actualizar1RM(ejId, fecha) * factorCarga * (1 + ruido(0.012));
    const repsObjetivo = Math.round((rMin + rMax) / 2);
    const paso = ejId === 62 || ejId === 33 ? 2 : 2.5;
    const peso = Math.max(redondear(e1rm / (1 + (repsObjetivo + rirObj) / 30), paso), paso);

    // A veces se hace una serie menos que la prescripta
    let hechas = nSeries;
    if (azar() < 0.1 && nSeries > 2) hechas -= 1;

    for (let s = 1; s <= hechas; s++) {
      const fatiga = 1 - 0.035 * (s - 1);
      const rir = limitar(rirObj + entero(-1, 1) - (s === hechas && s > 1 ? 1 : 0), 0, 4);
      const reps = limitar(Math.round(30 * ((e1rm * fatiga) / peso - 1) - rir), Math.max(rMin - 1, 1), rMax + 1);
      series.push({ ejercicioId: ejId, numero: s, peso, reps, rir });
    }
  }
  return series;
}

function planificarSesiones(plan, planId, rutinaIds, desdeSesion, hastaSesion, esDescarga) {
  const sesiones = [];
  for (const fecha of rango(desdeSesion, hastaSesion)) {
    const idx = plan.dias.indexOf(diaSemana(fecha));
    if (idx === -1) continue;
    if (fecha > HOY) continue;
    // ~12 % de ausencias
    if (azar() < 0.12) continue;
    const rutina = plan.rutinas[idx];
    const factor = esDescarga(fecha) ? 0.88 : 1;
    sesiones.push({ planId, rutinaId: rutinaIds[idx], fecha, series: simularSesion(plan, rutina, fecha, factor) });
  }
  return sesiones;
}

// ---------- peso corporal ----------
function simularMediciones(desde, hasta, existentes) {
  // Tendencia de 78,2 kg (27/07) a 74,6 kg (28/09) y a 70,0 kg (el 26/11 ya hay una medición
  // de 70 kg cargada a mano)
  const corte = PLAN_A.desde;
  const salida = [];
  for (const fecha of rango(desde, hasta)) {
    if (existentes.has(fecha)) continue;
    // se pesa 3-4 veces por semana, más seguido a la mañana de los lunes
    const prob = diaSemana(fecha) === 1 ? 0.95 : 0.45;
    if (azar() > prob) continue;
    const base =
      fecha < corte
        ? 78.2 - 3.6 * (diasEntre(desde, fecha) / diasEntre(desde, corte))
        : 74.6 - 4.6 * (diasEntre(corte, fecha) / diasEntre(corte, hasta));
    const peso = base + ruido(0.45);
    salida.push({ fecha, peso: Math.round(peso * 10) / 10 });
  }
  return salida;
}

// ---------- principal ----------
(async () => {
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    port: +env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    dateStrings: true,
  });

  if (process.argv.includes('--limpiar')) {
    if (!fs.existsSync(MANIFIESTO)) return console.log('No hay manifiesto: nada para limpiar.'), c.end();
    const m = JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8'));
    await c.beginTransaction();
    if (m.sesiones.length) await c.query('DELETE FROM sesion_entrenamiento WHERE id IN (?)', [m.sesiones]);
    if (m.mediciones.length) await c.query('DELETE FROM medicion_corporal WHERE id IN (?)', [m.mediciones]);
    if (m.planes.length) await c.query('DELETE FROM plan_entrenamiento WHERE id IN (?)', [m.planes]);
    await c.commit();
    fs.unlinkSync(MANIFIESTO);
    console.log(`Limpiado: ${m.planes.length} planes, ${m.sesiones.length} sesiones, ${m.mediciones.length} mediciones.`);
    return c.end();
  }

  if (fs.existsSync(MANIFIESTO)) {
    console.error('Ya hay una simulación cargada. Corré con --limpiar primero.');
    process.exit(1);
  }

  const [[entrenador]] = await c.query('SELECT id FROM usuario WHERE email=?', [ENTRENADOR_EMAIL]);
  const [[deportista]] = await c.query('SELECT id FROM usuario WHERE email=?', [DEPORTISTA_EMAIL]);
  if (!entrenador || !deportista) throw new Error('No encuentro a los dos usuarios.');

  // Plan "fuerza" cargado a mano (vigente desde 15/11): se respeta y se le agregan sesiones
  const [[existente]] = await c.query(
    `SELECT a.plan_id, a.vigencia_desde desde, a.vigencia_hasta hasta FROM asignacion a
     WHERE a.deportista_id=? AND a.vigencia_desde > ? ORDER BY a.vigencia_desde LIMIT 1`,
    [deportista.id, PLAN_B.hasta],
  );
  const [medExistentes] = await c.query('SELECT fecha FROM medicion_corporal WHERE deportista_id=?', [deportista.id]);
  const fechasConMedicion = new Set(medExistentes.map((r) => r.fecha));

  const manifiesto = { planes: [], sesiones: [], mediciones: [] };
  const todasLasSesiones = [];

  await c.beginTransaction();
  try {
    // 1) Planes del entrenador + asignación al deportista
    for (const [plan, descarga] of [
      [PLAN_0, () => false],
      [PLAN_00, (f) => f >= '2026-09-21' && f <= '2026-09-27'],
      [PLAN_A, (f) => f >= '2026-10-19' && f <= '2026-10-25'],
      [PLAN_B, () => false],
    ]) {
      const [rp] = await c.query('INSERT INTO plan_entrenamiento (entrenador_id, nombre, indicaciones) VALUES (?,?,?)', [
        entrenador.id,
        plan.nombre,
        plan.indicaciones,
      ]);
      const planId = rp.insertId;
      manifiesto.planes.push(planId);
      const rutinaIds = [];
      for (const [i, r] of plan.rutinas.entries()) {
        const [rr] = await c.query('INSERT INTO rutina (nombre, orden, plan_id) VALUES (?,?,?)', [r.nombre, i + 1, planId]);
        rutinaIds.push(rr.insertId);
        const filas = r.ej.map(([ejId, n, [mn, mx], rir], k) => [ejId, k + 1, n, rir, rr.insertId, mn, mx]);
        await c.query(
          'INSERT INTO dosificacion (ejercicio_id, orden, series_objetivo, rir_objetivo, rutina_id, reps_min, reps_max) VALUES ?',
          [filas],
        );
      }
      await c.query('INSERT INTO asignacion (plan_id, deportista_id, vigencia_desde, vigencia_hasta) VALUES (?,?,?,?)', [
        planId,
        deportista.id,
        plan.desde,
        plan.hasta,
      ]);
      todasLasSesiones.push(...planificarSesiones(plan, planId, rutinaIds, plan.desde, plan.hasta, descarga));
    }

    // 2) Sesiones en el plan que ya estaba cargado (rutinas alternadas lun/mié/vie)
    if (existente) {
      const [rutinas] = await c.query('SELECT id FROM rutina WHERE plan_id=? ORDER BY id', [existente.plan_id]);
      const [dosis] = await c.query('SELECT rutina_id, ejercicio_id, orden, series_objetivo, reps_min, reps_max, rir_objetivo FROM dosificacion ORDER BY rutina_id, orden');
      const planExistente = {
        dias: [1, 3, 5],
        rutinas: rutinas.map((r) => ({
          ej: dosis.filter((d) => d.rutina_id === r.id).map((d) => [d.ejercicio_id, d.series_objetivo, [d.reps_min, d.reps_max], d.rir_objetivo]),
        })),
      };
      let alternar = 0;
      for (const fecha of rango(existente.desde, HOY)) {
        if (![1, 3, 5].includes(diaSemana(fecha)) || fecha >= HOY) continue;
        if (azar() < 0.12) { alternar++; continue; }
        const idx = alternar++ % rutinas.length;
        for (const [ejId] of planExistente.rutinas[idx].ej) if (!E1RM[ejId]) E1RM[ejId] = 60;
        todasLasSesiones.push({
          planId: existente.plan_id,
          rutinaId: rutinas[idx].id,
          fecha,
          series: simularSesion(planExistente, planExistente.rutinas[idx], fecha, 1),
        });
      }
    }

    // 3) Insertar sesiones y series
    for (const s of todasLasSesiones) {
      const [rs] = await c.query(
        'INSERT INTO sesion_entrenamiento (deportista_id, plan_id, rutina_id, fecha) VALUES (?,?,?,?)',
        [deportista.id, s.planId, s.rutinaId, s.fecha],
      );
      manifiesto.sesiones.push(rs.insertId);
      await c.query('INSERT INTO serie (sesion_id, ejercicio_id, numero_serie, peso, repeticiones, rir) VALUES ?', [
        s.series.map((x) => [rs.insertId, x.ejercicioId, x.numero, x.peso, x.reps, x.rir]),
      ]);
    }

    // 4) Peso corporal
    for (const m of simularMediciones(PLAN_0.desde, sumarDias(HOY, -1), fechasConMedicion)) {
      const [rm] = await c.query('INSERT INTO medicion_corporal (deportista_id, fecha, peso_corporal, altura) VALUES (?,?,?,?)', [
        deportista.id,
        m.fecha,
        m.peso,
        ALTURA,
      ]);
      manifiesto.mediciones.push(rm.insertId);
    }

    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  }

  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
  console.log(
    `Listo: ${manifiesto.planes.length} planes, ${manifiesto.sesiones.length} sesiones, ${manifiesto.mediciones.length} mediciones.`,
  );
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
