// src/modules/common/helpers/fecha-actual.helper.ts

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

// Fecha de hoy en Argentina, en formato 'YYYY-MM-DD'.
// Usarla siempre en lugar de new Date() suelto (RN8, RN12, plan vigente, una medición por día).
export function fechaActual(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(
    new Date(),
  );
}