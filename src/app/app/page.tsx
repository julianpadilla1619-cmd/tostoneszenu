"use client";

import Link from "next/link";
import { ArrowRight, BellRing, CalendarX2, Clock, MapPin, Pencil, RotateCcw, Truck, Undo2 } from "lucide-react";
import { ProductArt } from "@/components/brand/Brand";
import { Card, StatusBadge, useToast } from "@/components/ui/ui";
import { dayLong, money, qty, weekRange } from "@/lib/format";
import { currentWeek, orderPacks, orderTotal } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { cutoffLeft, cutoffText } from "@/lib/week";

export default function ClienteInicio() {
  const { state, me, saveOrder } = useStore();
  const [toast, showToast] = useToast();
  if (!me) return null;

  const week = currentWeek(state);
  const order = state.orders.find((o) => o.customerId === me.id && o.weekId === week.id);
  const previous = state.orders
    .filter((o) => o.customerId === me.id && o.weekId !== week.id && o.items.length > 0)
    .sort((a, b) => b.weekId.localeCompare(a.weekId))[0];
  const left = cutoffLeft(week);
  const status = order?.status;
  const hasOrder = order && order.items.length > 0 && status !== "cancelado" && status !== "no_pide";

  const history = state.orders.filter((o) => o.customerId === me.id && o.status === "entregado");
  const last4 = history.slice(-4);

  function skip() {
    saveOrder(me!.id, week.id, {}, undefined, "no_pide");
    showToast("Listo. Esta semana no te mandamos nada.");
  }
  function undoSkip() {
    saveOrder(me!.id, week.id, {}, undefined, "cancelado");
  }
  function repeat() {
    if (!previous) return;
    const q = Object.fromEntries(previous.items.map((i) => [i.productId, i.qty]));
    saveOrder(me!.id, week.id, q, undefined, "confirmado");
    showToast("Repetimos tu pedido anterior. ¡Quedó montado!");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-subir">
        <p className="text-sm text-tinta-2">Hola, {me.fullName.split(" ")[0]} 👋</p>
        <h1 className="font-display text-3xl font-black leading-tight">Tu pedido de la semana</h1>
      </div>

      {/* Tarjeta semana */}
      <section className="animate-subir overflow-hidden rounded-[1.75rem] bg-noche text-cana shadow-[var(--shadow-calida)] [animation-delay:60ms]">
        <div className="trenza trenza-oro h-3" aria-hidden />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oro">Semana {weekRange(week.startsOn)}</p>
            <StatusBadge status={status ?? "sin_pedido"} className="!bg-cana/10 !text-oro-claro" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-cana/75">
            <Clock className="size-4 text-oro" />
            <span>{cutoffText(week)}</span>
            {left.open && <span className="ml-auto text-cana/50">jueves 6 p. m.</span>}
          </div>
          {left.open && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cana/10">
              <div className="h-full rounded-full bg-oro" style={{ width: `${Math.max(6, 100 - (left.ms / (4 * 24 * 3_600_000)) * 100)}%` }} />
            </div>
          )}

          {hasOrder ? (
            <div className="mt-5">
              <ul className="space-y-2">
                {order!.items.map((i) => {
                  const p = state.products.find((x) => x.id === i.productId)!;
                  return (
                    <li key={i.productId} className="flex items-center gap-3 rounded-2xl bg-cana/5 p-2.5">
                      <ProductArt kind={p.kind} className="size-11" />
                      <div className="flex-1">
                        <p className="font-semibold">{p.name}</p>
                        <p className="tabular text-xs text-cana/55">
                          {qty(i.qty)} × {money(i.unitPrice)}
                        </p>
                      </div>
                      <p className="tabular font-display text-lg font-bold text-oro-claro">{qty(i.qty)}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-end justify-between border-t border-dashed border-cana/15 pt-4">
                <div>
                  <p className="text-xs text-cana/55">{qty(orderPacks(order!))} paquetes</p>
                  <p className="tabular font-display text-3xl font-black text-oro">{money(orderTotal(order!))}</p>
                </div>
                {left.open && status !== "en_camino" && (
                  <Link href="/app/pedido" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-cana/10 px-4 text-sm font-semibold hover:bg-cana/15">
                    <Pencil className="size-4" /> Editar
                  </Link>
                )}
              </div>
              {status === "borrador" && (
                <p className="mt-3 rounded-xl bg-toston/15 px-3 py-2 text-sm text-oro-claro">Tu pedido está en borrador. Confírmalo antes del corte para que entre a producción.</p>
              )}
            </div>
          ) : status === "no_pide" ? (
            <div className="mt-5 flex flex-col items-start gap-3">
              <div className="flex items-center gap-3">
                <CalendarX2 className="size-8 text-oro" />
                <p className="text-cana/80">Marcaste que <b className="text-cana">esta semana no pides</b>. Te escribimos la próxima.</p>
              </div>
              {left.open && (
                <button onClick={undoSkip} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-cana/10 px-3 text-sm font-semibold">
                  <Undo2 className="size-4" /> Cambié de opinión
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href="/app/pedido"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-oro font-bold text-noche shadow-[var(--shadow-oro)] transition active:scale-[.97]"
              >
                Hacer mi pedido <ArrowRight className="size-5" />
              </Link>
              <div className="grid grid-cols-2 gap-2.5">
                {previous && (
                  <button onClick={repeat} className="inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-cana/10 text-sm font-semibold transition active:scale-[.97]">
                    <RotateCcw className="size-4" /> Repetir anterior
                  </button>
                )}
                <button
                  onClick={skip}
                  className={"inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-cana/15 text-sm font-semibold text-cana/80 transition active:scale-[.97] " + (previous ? "" : "col-span-2")}
                >
                  <CalendarX2 className="size-4" /> Esta semana no
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Entrega */}
      <Card className="animate-subir flex items-start gap-3 [animation-delay:120ms]">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cafe text-cana">
          <Truck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Entrega</p>
          <p className="font-display text-lg font-bold">{dayLong(week.deliveryOn)}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-tinta-2">
            <MapPin className="size-3.5 shrink-0" /> {me.address ?? "Sin dirección"} · {me.municipality}
          </p>
        </div>
      </Card>

      {/* Resumen */}
      <div className="animate-subir grid grid-cols-2 gap-3 [animation-delay:180ms]">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Últimas 4 semanas</p>
          <p className="tabular mt-2 font-display text-2xl font-bold">{qty(last4.reduce((a, o) => a + orderPacks(o), 0))}</p>
          <p className="text-xs text-tinta-2">paquetes recibidos</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">Promedio</p>
          <p className="tabular mt-2 font-display text-2xl font-bold">
            {money(last4.length ? Math.round(last4.reduce((a, o) => a + orderTotal(o), 0) / last4.length) : 0)}
          </p>
          <p className="text-xs text-tinta-2">por semana</p>
        </Card>
      </div>

      <Card className="animate-subir flex items-center gap-3 border-dashed [animation-delay:240ms]">
        <BellRing className="size-6 shrink-0 text-canela" />
        <p className="flex-1 text-sm text-tinta-2">Activa las notificaciones y te recordamos el jueves.</p>
        <Link href="/app/perfil" className="inline-flex h-9 items-center rounded-2xl bg-noche px-3 text-sm font-semibold text-cana">
          Activar
        </Link>
      </Card>
      {toast}
    </div>
  );
}
