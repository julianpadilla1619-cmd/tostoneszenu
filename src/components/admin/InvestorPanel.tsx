"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { SplitBar } from "@/components/charts/Charts";
import { Button, Card, CardTitle, Segmented, useToast } from "@/components/ui/ui";
import { dayLabel, dayShort, money } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { PERIODS, periodRange, type PeriodKey } from "@/lib/periods";
import { finance, investorSplit } from "@/lib/selectors";
import { newId, useStore } from "@/lib/store";
import type { Investor } from "@/lib/types";

/** Calculadora de reparto. `readOnly` = vista del inversionista (sin detalle de movimientos). */
export function InvestorPanel({ investor, readOnly }: { investor: Investor; readOnly?: boolean }) {
  const { state, dispatch } = useStore();
  const [toast, showToast] = useToast();
  const [period, setPeriod] = useState<PeriodKey>("mes_pasado");
  const { from, to } = periodRange(period);
  const f = finance(state, from, to);
  const split = investorSplit(f.net, investor.percentage);
  const paid = state.payouts.filter((p) => p.investorId === investor.id && p.periodStart >= from && p.periodEnd <= to).reduce((a, p) => a + p.amount, 0);
  const pending = Math.max(0, split.investor - paid);
  const history = state.payouts.filter((p) => p.investorId === investor.id).sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));

  return (
    <div className="flex flex-col gap-4">
      <Segmented value={period} onChange={setPeriod} options={PERIODS.filter((p) => p.value !== "todo")} />

      <Card className="relative overflow-hidden">
        <div className="trenza trenza-oro absolute inset-x-0 top-0 h-2 opacity-80" aria-hidden />
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-tinta-2">
          {dayShort(from)} – {dayShort(to)}
        </p>

        <div className="tabular mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm text-tinta-2">Ingresos</p>
            <p className="font-display text-2xl font-bold">{money(f.income)}</p>
          </div>
          <div>
            <p className="text-sm text-tinta-2">Egresos</p>
            <p className="font-display text-2xl font-bold">−{money(f.expense)}</p>
          </div>
          <div>
            <p className="text-sm text-tinta-2">Ganancia neta</p>
            <p className={"font-display text-2xl font-black " + (f.net >= 0 ? "text-ok" : "text-mal")}>{money(f.net)}</p>
          </div>
        </div>

        <div className="mt-6">
          {f.net > 0 ? (
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
            <p className="text-sm font-semibold opacity-75">{readOnly ? "Te corresponde" : `Le corresponde a ${investor.name.split(" ")[0]}`}</p>
            <p className="font-display text-4xl font-black">{money(split.investor)}</p>
            <p className="mt-1 text-xs font-semibold opacity-75">
              {money(Math.max(f.net, 0))} × {investor.percentage} %
            </p>
          </div>
          <div className="rounded-2xl bg-card-2 p-4">
            <p className="text-sm text-tinta-2">Para el negocio / dueño</p>
            <p className="font-display text-4xl font-black">{money(split.owner)}</p>
            <p className="mt-1 text-xs text-tinta-2">
              Pagado: {money(paid)} · <b className={pending ? "text-oro" : "text-ok"}>Pendiente: {money(pending)}</b>
            </p>
          </div>
        </div>

        {!readOnly && pending > 0 && (
          <Button
            className="mt-4 w-full sm:w-auto"
            icon={<HandCoins className="size-5" />}
            onClick={() => {
              dispatch({ type: "addPayout", payout: { id: newId("po"), investorId: investor.id, periodStart: from, periodEnd: to, amount: pending, paidOn: DEMO_TODAY } });
              showToast(`Pago de ${money(pending)} registrado`);
            }}
          >
            Registrar pago de {money(pending)}
          </Button>
        )}
      </Card>

      <Card>
        <CardTitle>Pagos {readOnly ? "recibidos" : "realizados"}</CardTitle>
        {history.length === 0 ? (
          <p className="text-sm text-tinta-2">Aún no hay pagos.</p>
        ) : (
          <ul className="divide-y divide-linea text-sm">
            {history.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
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
      {toast}
    </div>
  );
}
