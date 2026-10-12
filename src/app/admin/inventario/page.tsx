"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { Card } from "@/components/ui/ui";
import { money, qty } from "@/lib/format";
import { currentWeek, inventory, weekBoard } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function Inventario() {
  const { state } = useStore();
  const inv = inventory(state);
  const board = weekBoard(state, currentWeek(state).id);

  return (
    <>
      <PageHead
        title="Inventario"
        sub="Stock = producido − merma − vendido (entregado)."
        action={
          <Link href="/admin/produccion" className="inline-flex h-9 items-center gap-2 rounded-2xl bg-oro px-3 text-sm font-semibold text-noche">
            <Flame className="size-4" /> Registrar producción
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {inv.map((i) => {
          const committed = board.byProduct.find((b) => b.product.id === i.product.id)?.qty ?? 0;
          const free = i.stock - committed;
          const pct = Math.min(100, (i.stock / Math.max(i.product.lowStockThreshold * 3, 1)) * 100);
          return (
            <Card key={i.product.id} className="relative overflow-hidden">
              <div className="flex items-center gap-4">
                <ProductArt kind={i.product.kind} className="size-16 shrink-0" />
                <div className="flex-1">
                  <p className="font-display text-xl font-bold">{i.product.name}</p>
                  <p className="text-xs text-tinta-2">{i.product.presentation}</p>
                </div>
                {i.low ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mal/15 px-2.5 py-1 text-xs font-semibold text-mal">
                    <AlertTriangle className="size-3.5" /> Bajo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">
                    <CheckCircle2 className="size-3.5" /> OK
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">En bodega</p>
                  <p className="tabular font-display text-5xl font-black text-oro">{qty(i.stock)}</p>
                </div>
                <p className="tabular text-right text-sm text-tinta-2">
                  Valor a costo
                  <b className="block font-display text-lg text-tinta">{money(i.stock * i.product.unitCost)}</b>
                </p>
              </div>

              <div className="relative mt-3 h-2.5 rounded-full bg-card-2" aria-hidden>
                <div className={"h-full rounded-full " + (i.low ? "bg-mal" : "bg-oro")} style={{ width: `${pct}%` }} />
                <div className="absolute inset-y-[-3px] w-0.5 bg-tinta-2" style={{ left: `${100 / 3}%` }} title="Mínimo" />
              </div>
              <p className="mt-1 text-xs text-tinta-2">Mínimo: {qty(i.product.lowStockThreshold)} paquetes</p>

              <dl className="tabular mt-4 grid grid-cols-4 gap-2 border-t border-linea pt-4 text-center text-xs">
                {[
                  ["Producido", i.produced, ""],
                  ["Merma", i.waste, "text-mal"],
                  ["Vendido", i.sold, ""],
                  ["Libre semana", free, free < 0 ? "text-mal" : "text-ok"],
                ].map(([k, v, cls]) => (
                  <div key={k as string}>
                    <dt className="text-tinta-2">{k}</dt>
                    <dd className={"mt-0.5 text-base font-bold " + cls}>{qty(v as number)}</dd>
                  </div>
                ))}
              </dl>
              {free < 0 && (
                <p className="mt-3 rounded-xl bg-mal/10 px-3 py-2 text-sm text-rojo-claro">
                  Faltan <b>{qty(-free)}</b> paquetes para cubrir los pedidos de esta semana.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
