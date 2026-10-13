"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { addPayout } from "@/app/actions/admin";
import { SplitBar } from "@/components/charts/Charts";
import { ActionButton } from "@/components/shared/ActionButton";
import { Card, CardTitle, Segmented } from "@/components/ui/ui";
import { dayLabel, dayShort, money } from "@/lib/format";
import type { PeriodKey } from "@/lib/periods";
import { investorSplit } from "@/lib/selectors";
import type { Investor, InvestorPayout } from "@/lib/types";

export type PeriodTotals = Record<PeriodKey, { from: string; to: string; income: number; expense: number; net: number }>;
const KEYS: { value: PeriodKey; label: string }[] = [
  { value: "mes", label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "semana", label: "Esta semana" },
  { value: "anio", label: "Este año" },
];

/** Calculadora de reparto. `readOnly` = vista del inversionista. */
export function InvestorPanel({ investor, totals, payouts, readOnly }: { investor: Investor; totals: PeriodTotals; payouts: InvestorPayout[]; readOnly?: boolean }) {
  const [period, setPeriod] = useState<PeriodKey>("mes_pasado");
  const t = totals[period];
  const split = investorSplit(t.net, investor.percentage);
  const paid = payouts.filter((p) => p.periodStart >= t.from && p.periodEnd <= t.to).reduce((a, p) => a + p.amount, 0);
  const pending = Math.max(0, split.investor - paid);

  return (
    <div className="flex flex-col gap-4">
      <Segmented value={period} onChange={setPeriod} options={KEYS} />
      <Card className="relative overflow-hidden">
        <div className="trenza trenza-oro absolute inset-x-0 top-0 h-2 opacity-80" aria-hidden />
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-tinta-2">
          {dayShort(t.from)} – {dayShort(t.to)}
        </p>
        <dl className="tabular mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-tinta-2">Ingresos</dt>
            <dd className="font-display text-2xl font-bold">{money(t.income)}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-2">Gastos</dt>
            <dd className="font-display text-2xl font-bold">−{money(t.expense)}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-2">Ganancia neta</dt>
            <dd className={"font-display text-2xl font-black " + (t.net >= 0 ? "text-ok" : "text-mal")}>{money(t.net)}</dd>
          </div>
        </dl>
        <div className="mt-6">
          {t.net > 0 ? (
            <SplitBar
              parts={[
                { label: `${investor.name} · ${investor.percentage} %`, value: split.investor, color: "var(--color-serie-1)" },
                { label: `Negocio · ${100 - investor.percentage} %`, value: split.owner, color: "var(--color-serie-3)" },
              ]}
            />
          ) : (
            <p className="rounded-xl bg-mal/10 px-3 py-2 text-sm text-rojo-claro">No hubo ganancia en este periodo, así que no hay reparto.</p>
          )}
        </div>
        <div className="tabular mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-oro p-4 text-noche">
            <p className="text-sm font-semibold opacity-80">{readOnly ? "Te corresponde" : `Le corresponde a ${investor.name.split(" ")[0]}`}</p>
            <p className="font-display text-4xl font-black">{money(split.investor)}</p>
            <p className="mt-1 text-xs font-semibold opacity-80">
              {money(Math.max(t.net, 0))} × {investor.percentage} %
            </p>
          </div>
          <div className="rounded-2xl bg-card-2 p-4">
            <p className="text-sm text-tinta-2">{readOnly ? "Estado de pago" : "Para el negocio"}</p>
            <p className="font-display text-4xl font-black">{readOnly ? money(paid) : money(split.owner)}</p>
            <p className="mt-1 text-xs text-tinta-2">
              {readOnly ? "pagado" : `Pagado: ${money(paid)}`} · <b className={pending ? "text-acento" : "text-ok"}>pendiente {money(pending)}</b>
            </p>
          </div>
        </div>
        {!readOnly && pending > 0 && (
          <div className="mt-4">
            <ActionButton
              variant="oro"
              size="md"
              icon={<HandCoins className="size-5" aria-hidden />}
              confirm={`¿Registrar que le pagaste ${money(pending)} a ${investor.name}?`}
              action={addPayout.bind(null, { investorId: investor.id, periodStart: t.from, periodEnd: t.to, amount: pending })}
            >
              Registrar pago de {money(pending)}
            </ActionButton>
          </div>
        )}
      </Card>
      <Card>
        <CardTitle>{readOnly ? "Pagos recibidos" : "Pagos realizados"}</CardTitle>
        {payouts.length === 0 ? (
          <p className="text-sm text-tinta-2">Aún no hay pagos.</p>
        ) : (
          <ul className="divide-y divide-linea text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex min-h-12 items-center justify-between py-2">
                <span>
                  {dayShort(p.periodStart)} – {dayShort(p.periodEnd)}
                  <span className="block text-xs text-tinta-2">{p.paidOn ? `Pagado ${dayLabel(p.paidOn)}` : "Pendiente"}</span>
                </span>
                <b className="tabular">{money(p.amount)}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
