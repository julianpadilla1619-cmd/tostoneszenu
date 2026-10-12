"use client";

import { CircleCheck, CircleDashed, ReceiptText } from "lucide-react";
import { Card, Empty, StatusBadge } from "@/components/ui/ui";
import { money, qty, weekRange } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/labels";
import { orderPacks, orderTotal } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function HistorialPage() {
  const { state, me } = useStore();
  if (!me) return null;
  const orders = state.orders.filter((o) => o.customerId === me.id).sort((a, b) => b.weekId.localeCompare(a.weekId));
  const delivered = orders.filter((o) => o.status === "entregado");
  const pending = delivered.filter((o) => !o.paid).reduce((a, o) => a + orderTotal(o), 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-black">Historial</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Total comprado</p>
          <p className="tabular mt-2 font-display text-xl font-bold">{money(delivered.reduce((a, o) => a + orderTotal(o), 0))}</p>
        </Card>
        <Card className={pending ? "border-mal/40" : ""}>
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Por pagar</p>
          <p className={"tabular mt-2 font-display text-xl font-bold " + (pending ? "text-mal" : "text-ok")}>{money(pending)}</p>
        </Card>
      </div>

      {orders.length === 0 && <Empty icon={<ReceiptText className="size-8" />} title="Aún no tienes pedidos" />}

      <ol className="flex flex-col gap-3">
        {orders.map((o) => {
          const w = state.weeks.find((x) => x.id === o.weekId)!;
          return (
            <li key={o.id}>
              <Card as="article">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg font-bold">Semana {weekRange(w.startsOn)}</p>
                  <StatusBadge status={o.status} />
                </div>
                {o.items.length > 0 ? (
                  <>
                    <ul className="mt-2 space-y-0.5 text-sm text-tinta-2">
                      {o.items.map((i) => (
                        <li key={i.productId} className="tabular flex justify-between">
                          <span>{state.products.find((p) => p.id === i.productId)?.name}</span>
                          <span>{qty(i.qty)} paq.</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-linea pt-3">
                      <span className="tabular text-sm text-tinta-2">{qty(orderPacks(o))} paquetes</span>
                      <span className="tabular font-display text-lg font-bold">{money(orderTotal(o))}</span>
                    </div>
                    {o.status === "entregado" && (
                      <p className={"mt-2 flex items-center gap-1.5 text-xs font-semibold " + (o.paid ? "text-ok" : "text-mal")}>
                        {o.paid ? <CircleCheck className="size-4" /> : <CircleDashed className="size-4" />}
                        {o.paid ? `Pagado · ${METHOD_LABEL[o.paymentMethod ?? "efectivo"]}` : "Pendiente de pago"}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-tinta-2">Sin productos esta semana.</p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
