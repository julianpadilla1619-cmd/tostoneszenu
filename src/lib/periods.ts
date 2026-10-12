import { addDays } from "./format";
import { DEMO_TODAY } from "./mock-data";

export type PeriodKey = "semana" | "semana_pasada" | "mes" | "mes_pasado" | "todo";

export const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "semana", label: "Esta semana" },
  { value: "semana_pasada", label: "Semana pasada" },
  { value: "mes", label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "todo", label: "Todo" },
];

/** Rango [desde, hasta] (inclusive) relativo al "hoy" del prototipo. */
export function periodRange(key: PeriodKey, today = DEMO_TODAY): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const monday = mondayOf(today);
  const p = (n: number) => String(n).padStart(2, "0");
  switch (key) {
    case "semana":
      return { from: monday, to: addDays(monday, 6) };
    case "semana_pasada":
      return { from: addDays(monday, -7), to: addDays(monday, -1) };
    case "mes":
      return { from: `${y}-${p(m)}-01`, to: addDays(`${m === 12 ? y + 1 : y}-${p(m === 12 ? 1 : m + 1)}-01`, -1) };
    case "mes_pasado": {
      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;
      return { from: `${py}-${p(pm)}-01`, to: addDays(`${y}-${p(m)}-01`, -1) };
    }
    case "todo":
      return { from: "2000-01-01", to: "2999-12-31" };
  }
}

export function mondayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay() || 7; // 1=lun … 7=dom
  return addDays(iso, 1 - dow);
}
