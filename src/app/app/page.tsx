import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarX2, Clock, MapPin, Pencil, Truck } from "lucide-react";
import { ProductArt } from "@/components/brand/Brand";
import { SkipWeekButton } from "@/components/cliente/SkipWeekButton";
import { Card, Skeleton, StatusBadge } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { getCatalog, myOrders } from "@/lib/data";
import { dayLong, dayShort, hour12, money, qty } from "@/lib/format";
import { orderPacks, orderTotal } from "@/lib/selectors";
import { isEditable, orderWindow, timeLeft } from "@/lib/time";

export default function ClienteInicio() {
  return (
    <Suspense fallback={<InicioSkeleton />}>
      <Inicio />
    </Suspense>
  );
}

async function Inicio() {
  const me = await requirePage(["mayorista"]);
  const [{ settings, products }, orders] = await Promise.all([getCatalog(), myOrders(me.id)]);
  const win = orderWindow(settings);
  const order = orders.find((o) => o.weekStart === win.weekStart);
  const hasItems = !!order && order.items.length > 0 && !["cancelado", "no_pide"].includes(order.status);
  const editable = order
    ? isEditable(order.deliveryOn, order.weekStart, settings) && ["confirmado", "borrador", "no_pide", "cancelado"].includes(order.status)
    : win.open.length > 0;
  const next = win.open[0];
  const productById = new Map(products.map((p) => [p.id, p]));
  const firstName = me.fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-subir">
        <p className="text-sm text-tinta-2">Hola, {firstName}</p>
        <h1 className="font-display text-3xl font-black leading-tight">Tu pedido de la semana</h1>
      </div>

      <section aria-label="Pedido de esta semana" className="animate-subir overflow-hidden rounded-[1.75rem] bg-noche text-cana shadow-[var(--shadow-calida)]">
        <div className="trenza trenza-oro h-3" aria-hidden />
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oro">Semana del {dayShort(win.weekStart)}</p>
            <StatusBadge status={order && order.status !== "cancelado" ? order.status : "sin_pedido"} emptyLabel="Sin pedido" className="!bg-cana/10 !text-oro-claro" />
          </div>

          {next && editable && (
            <p className="mt-3 flex items-start gap-2 text-sm text-cana/80">
              <Clock className="mt-0.5 size-4 shrink-0 text-oro" aria-hidden />
              <span>
                {timeLeft(next.cutoff)} para pedir para el <b className="text-cana">{dayLong(next.date).toLowerCase()}</b> (hasta las {hour12(settings.cutoffTime)} del día anterior).
              </span>
            </p>
          )}

          {hasItems ? (
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-sm text-cana/80">
                <Truck className="size-4 text-oro" aria-hidden /> Entrega: <b className="text-cana">{order!.deliveryOn ? dayLong(order!.deliveryOn) : "por definir"}</b>
              </p>
              <ul className="space-y-2">
                {order!.items.map((i) => {
                  const p = productById.get(i.productId);
                  return (
                    <li key={i.productId} className="flex items-center gap-3 rounded-2xl bg-cana/5 p-2.5">
                      <ProductArt kind={p?.category ?? "platano"} className="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p?.name ?? "Producto"}</p>
                        <p className="tabular text-xs text-cana/65">
                          {qty(i.qty)} × {money(i.unitPrice)}
                        </p>
                      </div>
                      <p className="tabular font-display text-lg font-bold text-oro-claro">{qty(i.qty)}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-cana/15 pt-4">
                <div>
                  <p className="text-xs text-cana/65">{qty(orderPacks(order!))} paquetes</p>
                  <p className="tabular font-display text-3xl font-black text-oro">{money(orderTotal(order!))}</p>
                </div>
                {editable && (
                  <Link href="/app/pedido" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cana/10 px-4 text-sm font-semibold hover:bg-cana/15">
                    <Pencil className="size-4" aria-hidden /> Cambiar
                  </Link>
                )}
              </div>
            </div>
          ) : order?.status === "no_pide" ? (
            <div className="mt-5 flex flex-col items-start gap-3">
              <p className="flex items-center gap-3 text-cana/85">
                <CalendarX2 className="size-8 shrink-0 text-oro" aria-hidden />
                Marcaste que esta semana no pides. Te recordamos la próxima.
              </p>
              {editable && <SkipWeekButton skip={false} />}
            </div>
          ) : win.open.length ? (
            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href="/app/pedido"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-oro font-bold text-noche shadow-[var(--shadow-oro)] transition active:scale-[.97]"
              >
                Hacer mi pedido <ArrowRight className="size-5" aria-hidden />
              </Link>
              <SkipWeekButton skip />
            </div>
          ) : (
            <p className="mt-5 text-cana/80">Los pedidos de esta semana ya cerraron. Pronto abrimos la siguiente.</p>
          )}
        </div>
      </section>

      <Card className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cafe text-cana">
          <MapPin className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Dirección de entrega</p>
          <p className="font-semibold">{me.address ?? "Sin dirección"}</p>
          {me.municipality && <p className="text-sm text-tinta-2">{me.municipality}</p>}
          {!me.address && (
            <Link href="/app/perfil" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-acento underline-offset-4 hover:underline">
              Agregar dirección
            </Link>
          )}
        </div>
      </Card>

      <p className="px-1 text-center text-sm text-tinta-2">
        Pedido mínimo: {settings.wholesaleMinPacks} paquetes · Entregas: {win.all.map((d) => dayShort(d)).join(" y ")}
      </p>
    </div>
  );
}

function InicioSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-72" />
      <Skeleton className="h-24" />
    </div>
  );
}
