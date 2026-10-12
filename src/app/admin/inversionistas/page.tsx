"use client";

import { useState } from "react";
import { PageHead } from "@/components/admin/AdminShell";
import { InvestorPanel } from "@/components/admin/InvestorPanel";
import { Card, Segmented } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

export default function Inversionistas() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(state.investors[0]?.id ?? "");
  const investor = state.investors.find((i) => i.id === selected);

  return (
    <>
      <PageHead title="Inversionistas" sub="Reparto automático de la ganancia neta según el porcentaje acordado." />
      {state.investors.length > 1 && (
        <Segmented className="mb-4" value={selected} onChange={setSelected} options={state.investors.map((i) => ({ value: i.id, label: i.name }))} />
      )}
      {investor && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <InvestorPanel investor={investor} />
          <Card className="h-fit">
            <p className="font-display text-lg font-bold">Porcentaje de {investor.name}</p>
            <p className="mt-1 text-sm text-tinta-2">Se aplica sobre la ganancia neta del periodo.</p>
            <div className="mt-5 flex items-end gap-2">
              <span className="tabular font-display text-6xl font-black text-oro">{investor.percentage}</span>
              <span className="mb-2 font-display text-2xl font-bold text-tinta-2">%</span>
            </div>
            <input
              type="range"
              min={1}
              max={90}
              value={investor.percentage}
              onChange={(e) => dispatch({ type: "updateInvestor", investor: { ...investor, percentage: Number(e.target.value) } })}
              className="mt-3 w-full accent-[var(--color-oro)]"
              aria-label="Porcentaje del inversionista"
            />
            <div className="mt-1 flex justify-between text-xs text-tinta-2">
              <span>1 %</span>
              <span>90 %</span>
            </div>
            <p className="mt-5 rounded-xl bg-card-2 p-3 text-xs leading-relaxed text-tinta-2">
              El inversionista ve esto mismo en su cuenta (<b className="text-tinta">/inversor</b>), en solo lectura y sin el detalle de los gastos.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
