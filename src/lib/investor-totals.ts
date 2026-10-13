import "server-only";
import type { PeriodTotals } from "@/components/admin/InvestorPanel";
import { financeSummary } from "./data";
import { periodRange, type PeriodKey } from "./periods";
import { todayBogota } from "./time";

const KEYS: PeriodKey[] = ["semana", "semana_pasada", "mes", "mes_pasado", "anio"];

/** Totales por periodo usando la RPC finance_summary (solo cifras agregadas). */
export async function periodTotals(): Promise<PeriodTotals> {
  const today = todayBogota();
  const rows = await Promise.all(
    KEYS.map(async (k) => {
      const r = periodRange(k, today);
      const s = await financeSummary(r.from, r.to);
      return [k, { ...r, ...s }] as const;
    }),
  );
  return Object.fromEntries(rows) as PeriodTotals;
}
