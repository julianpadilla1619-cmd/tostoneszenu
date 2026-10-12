import { DEMO_NOW } from "./mock-data";
import type { Week } from "./types";

/** Tiempo restante al corte (usa el "ahora" fijo del prototipo). */
export function cutoffLeft(week: Week, now = DEMO_NOW) {
  const ms = Date.parse(week.cutoffAt) - Date.parse(now);
  const open = ms > 0 && !week.closed;
  const h = Math.max(0, Math.floor(ms / 3_600_000));
  return { open, days: Math.floor(h / 24), hours: h % 24, ms };
}

export function cutoffText(week: Week) {
  const l = cutoffLeft(week);
  if (!l.open) return "Pedidos cerrados";
  if (l.days > 0) return `Faltan ${l.days} d ${l.hours} h para el corte`;
  return `Faltan ${l.hours} h para el corte`;
}
