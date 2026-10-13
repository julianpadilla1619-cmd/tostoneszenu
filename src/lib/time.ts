// Fechas del negocio en hora de Colombia (UTC−5, sin horario de verano).
import { addDays } from "./format";
import type { Settings } from "./types";

const TZ = "America/Bogota";
const OFFSET = "-05:00";

/** Fecha de hoy (YYYY-MM-DD) en Colombia. */
export function todayBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Día ISO de la semana (1 = lunes … 7 = domingo). */
export function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
}

export const mondayOf = (iso: string) => addDays(iso, 1 - isoWeekday(iso));

type CutoffSettings = Pick<Settings, "deliveryWeekdays" | "cutoffTime" | "cutoffDaysBefore">;

/** Instante límite para pedir/cambiar una entrega: `daysBefore` días antes, a la hora configurada. */
export function cutoffFor(deliveryOn: string, cutoffTime: string, daysBefore = 1): Date {
  return new Date(`${addDays(deliveryOn, -daysBefore)}T${cutoffTime.slice(0, 5)}:00${OFFSET}`);
}

/** Entregas de la semana que empieza en `weekStart`. */
export function deliveriesOfWeek(weekStart: string, settings: Pick<Settings, "deliveryWeekdays">): string[] {
  return [...settings.deliveryWeekdays].sort((a, b) => a - b).map((d) => addDays(weekStart, d - 1));
}

export interface OrderWindow {
  /** Lunes de la semana en la que se está pidiendo. */
  weekStart: string;
  /** Entregas de esa semana que todavía aceptan pedidos (con su hora límite). */
  open: { date: string; cutoff: string }[];
  /** Todas las entregas de esa semana. */
  all: string[];
}

/**
 * Semana "activa" para pedir: la de la próxima entrega que aún no pasó su hora límite.
 * Si en la semana actual ya cerraron todas, pasa a la siguiente.
 */
export function orderWindow(settings: CutoffSettings, now: Date = new Date()): OrderWindow {
  let weekStart = mondayOf(todayBogota(now));
  for (let i = 0; i < 2; i++) {
    const all = deliveriesOfWeek(weekStart, settings);
    const open = all
      .map((date) => ({ date, cutoff: cutoffFor(date, settings.cutoffTime, settings.cutoffDaysBefore).toISOString() }))
      .filter((d) => new Date(d.cutoff) > now);
    if (open.length) return { weekStart, open, all };
    weekStart = addDays(weekStart, 7);
  }
  const all = deliveriesOfWeek(weekStart, settings);
  return { weekStart, open: [], all };
}

/** ¿Todavía se puede cambiar un pedido con esa entrega? */
export function isEditable(deliveryOn: string | null, weekStart: string, settings: CutoffSettings, now: Date = new Date()) {
  if (deliveryOn) return cutoffFor(deliveryOn, settings.cutoffTime, settings.cutoffDaysBefore) > now;
  // Sin entrega (no pide / cancelado): editable mientras quede alguna entrega abierta esa semana.
  return deliveriesOfWeek(weekStart, settings).some((d) => cutoffFor(d, settings.cutoffTime, settings.cutoffDaysBefore) > now);
}

/** Día ISO (1–7) en que cierra cada día de entrega. */
export function cutoffWeekday(deliveryWeekday: number, daysBefore: number) {
  return ((((deliveryWeekday - 1 - daysBefore) % 7) + 7) % 7) + 1;
}

/** "Faltan 2 d 4 h" / "Faltan 3 h" / "Faltan 20 min". */
export function timeLeft(cutoffIso: string, now: Date = new Date()): string {
  const ms = new Date(cutoffIso).getTime() - now.getTime();
  if (ms <= 0) return "Cerrado";
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  if (d > 0) return `Faltan ${d} d ${h} h`;
  if (h > 0) return `Faltan ${h} h ${min % 60} min`;
  return `Faltan ${min} min`;
}

export const WEEKDAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** "martes y jueves" */
export function weekdayList(days: number[]): string {
  const names = [...days].sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d].toLowerCase());
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
}
