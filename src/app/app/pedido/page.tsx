import { Suspense } from "react";
import { OrderBuilder } from "@/components/cliente/OrderBuilder";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { getCatalog, myOrders } from "@/lib/data";
import { orderWindow } from "@/lib/time";

export default function PedidoPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Pedido />
    </Suspense>
  );
}

async function Pedido() {
  const me = await requirePage(["mayorista"]);
  const [{ settings, products }, orders] = await Promise.all([getCatalog(), myOrders(me.id)]);
  const win = orderWindow(settings);
  const current = orders.find((o) => o.weekStart === win.weekStart) ?? null;
  const previous = orders.find((o) => o.weekStart < win.weekStart && o.items.length > 0) ?? null;
  const locked = !!current && !["borrador", "confirmado", "no_pide", "cancelado"].includes(current.status);
  return (
    <OrderBuilder
      products={products}
      min={settings.wholesaleMinPacks}
      weekStart={win.weekStart}
      deliveries={win.open}
      current={current}
      previous={previous}
      locked={locked || win.open.length === 0}
      whatsapp={settings.whatsapp}
    />
  );
}
