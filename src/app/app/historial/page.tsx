import { Suspense } from "react";
import { CircleCheck, CircleDashed, ReceiptText } from "lucide-react";
import { Card, Empty, Skeleton, StatusBadge } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { getCatalog, myOrders } from "@/lib/data";
import { dayLong, dayShort, money, qty } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/labels";
import { orderPacks, orderTotal } from "@/lib/selectors";

export default function HistorialPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Historial />
    </Suspense>
  );
}

async function Historial() {
  const me = await requirePage(["mayorista"]);
  const [orders, { products }] = await Promise.all([myOrders(me.id), getCatalog()]);
  const name = new Map(products.map((p) => [p.id, p.name]));
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

      {orders.length === 0 && (
        <Empty icon={<ReceiptText className="size-8" aria-hidden />} title="Aún no tienes pedidos">
          Cuando hagas tu primer pedido aparecerá aquí.
        </Empty>
      )}

      <ol className="flex flex-col gap-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Card as="article">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-bold">{o.deliveryOn ? dayLong(o.deliveryOn) : `Semana del ${dayShort(o.weekStart)}`}</p>
                <StatusBadge status={o.status} />
              </div>
              {o.items.length > 0 ? (
                <>
                  <ul className="mt-2 space-y-0.5 text-sm text-tinta-2">
                    {o.items.map((i) => (
                      <li key={i.productId} className="tabular flex justify-between gap-3">
                        <span>{name.get(i.productId) ?? "Producto"}</span>
                        <span>{qty(i.qty)} paq.</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-linea pt-3">
                    <span className="tabular text-sm text-tinta-2">{qty(orderPacks(o))} paquetes</span>
                    <span className="tabular font-display text-lg font-bold">{money(orderTotal(o))}</span>
                  </div>
                  {o.status === "entregado" && (
                    <p className={"mt-2 flex items-center gap-1.5 text-sm font-semibold " + (o.paid ? "text-ok" : "text-mal")}>
                      {o.paid ? <CircleCheck className="size-4" aria-hidden /> : <CircleDashed className="size-4" aria-hidden />}
                      {o.paid ? `Pagado · ${METHOD_LABEL[o.paymentMethod ?? "efectivo"]}` : "Pendiente de pago"}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-tinta-2">Sin productos esa semana.</p>
              )}
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
