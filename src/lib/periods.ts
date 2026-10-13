import { addDays } from "./format";
import { mondayOf } from "./time";

export type PeriodKey = "semana" | "semana_pasada" | "mes" | "mes_pasado" | "anio";

export const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "semana", label: "Esta semana" },
  { value: "semana_pasada", label: "Semana pasada" },
  { value: "mes", label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "anio", label: "Este año" },
];

/** Rango [desde, hasta] inclusive relativo a `today` (YYYY-MM-DD, hora Colombia). */
export function periodRange(key: PeriodKey, today: string): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const p = (n: number) => String(n).padStart(2, "0");
  const monday = mondayOf(today);
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
    case "anio":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
}
