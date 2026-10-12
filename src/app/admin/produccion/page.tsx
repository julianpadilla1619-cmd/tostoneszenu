"use client";

import { useState } from "react";
import { Flame, Trash2 } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, CardTitle, Field, Input, Textarea, useToast } from "@/components/ui/ui";
import { addDays, dayLabel, dayShort, qty } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { ACTIVE_STATUSES } from "@/lib/selectors";
import { newId, useStore } from "@/lib/store";

export default function Produccion() {
  const { state, dispatch } = useStore();
  const [toast, showToast] = useToast();
  const [productId, setProductId] = useState(state.products[0]?.id ?? "");

  // Comparativo semanal: pedido vs producido vs vendido (entregado)
  const comparison = [...state.weeks].reverse().map((w) => {
    const end = addDays(w.startsOn, 6);
    const per = state.products.map((p) => {
      const ordersW = state.orders.filter((o) => o.weekId === w.id);
      const sum = (pred: (s: string) => boolean) =>
        ordersW.filter((o) => pred(o.status)).flatMap((o) => o.items).filter((i) => i.productId === p.id).reduce((a, i) => a + i.qty, 0);
      const batches = state.production.filter((b) => b.productId === p.id && b.producedOn >= w.startsOn && b.producedOn <= end);
      return {
        product: p,
        ordered: sum((s) => ACTIVE_STATUSES.includes(s as never)),
        produced: batches.reduce((a, b) => a + b.unitsProduced, 0),
        waste: batches.reduce((a, b) => a + b.unitsWaste, 0),
        sold: sum((s) => s === "entregado"),
      };
    });
    return { week: w, per };
  });

  const batches = [...state.production].sort((a, b) => b.producedOn.localeCompare(a.producedOn));

  return (
    <>
      <PageHead title="Producción" sub="Lo que se fritó, la merma y cómo cuadra con lo pedido." />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit lg:sticky lg:top-6">
          <CardTitle>Registrar lote</CardTitle>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const produced = Number(f.get("produced"));
              if (!produced) return;
              dispatch({
                type: "addBatch",
                batch: {
                  id: newId("b"),
                  producedOn: String(f.get("date")),
                  productId,
                  unitsProduced: produced,
                  unitsWaste: Number(f.get("waste")) || 0,
                  notes: String(f.get("notes") ?? "").trim() || undefined,
                },
              });
              e.currentTarget.reset();
              showToast("Lote registrado · inventario actualizado");
            }}
          >
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Producto">
              {state.products.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  role="radio"
                  aria-checked={productId === p.id}
                  onClick={() => setProductId(p.id)}
                  className={"flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-3 text-sm font-semibold transition " + (productId === p.id ? "border-oro bg-oro/10" : "border-linea")}
                >
                  <ProductArt kind={p.kind} className="size-10" />
                  {p.name}
                </button>
              ))}
            </div>
            <Field label="Fecha">{(id) => <Input id={id} name="date" type="date" defaultValue={DEMO_TODAY} required />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Paquetes producidos">{(id) => <Input id={id} name="produced" inputMode="numeric" required placeholder="0" />}</Field>
              <Field label="Merma (dañados)">{(id) => <Input id={id} name="waste" inputMode="numeric" placeholder="0" />}</Field>
            </div>
            <Field label="Notas">{(id) => <Textarea id={id} name="notes" rows={2} placeholder="Ej. plátano muy maduro" />}</Field>
            <Button type="submit" size="lg" icon={<Flame className="size-5" />}>
              Guardar lote
            </Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle>Pedido vs. producido vs. vendido</CardTitle>
            <div className="scroll-x -mx-4 overflow-x-auto px-4">
              <table className="tabular w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs text-tinta-2">
                  <tr>
                    <th className="py-2 font-semibold">Semana</th>
                    <th className="py-2 font-semibold">Producto</th>
                    <th className="py-2 text-right font-semibold">Pedido</th>
                    <th className="py-2 text-right font-semibold">Producido</th>
                    <th className="py-2 text-right font-semibold">Merma</th>
                    <th className="py-2 text-right font-semibold">Vendido</th>
                    <th className="py-2 text-right font-semibold">Sobrante</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(({ week, per }) =>
                    per.map((r, i) => {
                      const left = r.produced - r.waste - r.sold;
                      return (
                        <tr key={week.id + r.product.id} className={i === 0 ? "border-t border-linea" : ""}>
                          <td className="py-2 align-top text-tinta-2">{i === 0 ? dayShort(week.startsOn) : ""}</td>
                          <td className="py-2">{r.product.name}</td>
                          <td className="py-2 text-right">{qty(r.ordered)}</td>
                          <td className="py-2 text-right font-semibold">{qty(r.produced)}</td>
                          <td className="py-2 text-right text-mal">{r.waste ? qty(r.waste) : "—"}</td>
                          <td className="py-2 text-right">{qty(r.sold)}</td>
                          <td className={"py-2 text-right font-semibold " + (left < 0 ? "text-mal" : "text-ok")}>{r.produced ? qty(left) : "—"}</td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardTitle>Lotes registrados</CardTitle>
            <ul className="divide-y divide-linea">
              {batches.map((b) => {
                const p = state.products.find((x) => x.id === b.productId);
                return (
                  <li key={b.id} className="flex items-center gap-3 py-2.5">
                    {p && <ProductArt kind={p.kind} className="size-9 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p?.name}</p>
                      <p className="text-xs text-tinta-2">
                        {dayLabel(b.producedOn)}
                        {b.notes ? ` · ${b.notes}` : ""}
                      </p>
                    </div>
                    <div className="tabular text-right text-sm">
                      <p className="font-semibold">{qty(b.unitsProduced)}</p>
                      {b.unitsWaste > 0 && <p className="text-xs text-mal">−{qty(b.unitsWaste)} merma</p>}
                    </div>
                    <button onClick={() => dispatch({ type: "removeBatch", id: b.id })} className="grid size-9 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-mal/15 hover:text-mal" aria-label="Eliminar lote">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
      {toast}
    </>
  );
}
