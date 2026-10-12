"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleCheck, Circle, Clock, Flame, Inbox, PackageOpen, TrendingUp, Users } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { GroupedBars } from "@/components/charts/Charts";
import { Card, CardTitle, Stat } from "@/components/ui/ui";
import { addDays, dayShort, money, qty, weekRange } from "@/lib/format";
import { TASK_LABEL } from "@/lib/labels";
import { DEMO_TODAY } from "@/lib/mock-data";
import { currentWeek, finance, inventory, receivables, weekBoard, weeklySeries } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { cutoffText } from "@/lib/week";

export default function AdminResumen() {
  const { state, dispatch } = useStore();
  const week = currentWeek(state);
  const board = weekBoard(state, week.id);
  const inv = inventory(state);
  const series = weeklySeries(state);
  const last4 = finance(state, addDays(week.startsOn, -28), addDays(week.startsOn, -1));
  const debts = receivables(state);
  const newReq = state.requests.filter((r) => r.status === "nueva");
  const today = state.tasks.filter((t) => t.day === DEMO_TODAY || (t.day > DEMO_TODAY && t.day <= addDays(DEMO_TODAY, 1)));
  const low = inv.filter((i) => i.low);

  return (
    <>
      <PageHead title="Resumen" sub={`Semana ${weekRange(week.startsOn)} · ${cutoffText(week)}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pidieron" value={`${board.counts.pidieron}/${board.counts.total}`} sub={`${board.counts.sinRespuesta} sin responder`} icon={<Users className="size-4" />} />
        <Stat label="Paquetes" value={qty(board.totalPacks)} sub="pedidos esta semana" icon={<PackageOpen className="size-4" />} tone="oro" />
        <Stat label="Valor semana" value={money(board.totalValue)} sub="si se entrega todo" icon={<TrendingUp className="size-4" />} />
        <Stat label="Ganancia 4 sem." value={money(last4.net)} sub={`Margen ${Math.round(last4.margin)} %`} tone={last4.net >= 0 ? "ok" : "mal"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Plan de producción */}
        <Card className="relative overflow-hidden">
          <CardTitle
            action={
              <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-acento hover:underline">
                Consolidado <ArrowRight className="size-4" />
              </Link>
            }
          >
            Qué producir esta semana
          </CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {board.byProduct.map((b) => {
              const stock = inv.find((i) => i.product.id === b.product.id)?.stock ?? 0;
              const toMake = Math.max(0, b.qty - stock);
              return (
                <div key={b.product.id} className="rounded-2xl bg-card-2 p-4">
                  <div className="flex items-center gap-3">
                    <ProductArt kind={b.product.kind} className="size-11" />
                    <p className="font-semibold leading-tight">{b.product.name}</p>
                  </div>
                  <p className="tabular mt-3 font-display text-4xl font-black text-oro">{qty(toMake)}</p>
                  <p className="text-xs text-tinta-2">paquetes por fritar</p>
                  <dl className="tabular mt-3 grid grid-cols-2 gap-2 border-t border-linea pt-3 text-xs">
                    <div>
                      <dt className="text-tinta-2">Pedido</dt>
                      <dd className="font-semibold">{qty(b.qty)}</dd>
                    </div>
                    <div>
                      <dt className="text-tinta-2">En bodega</dt>
                      <dd className="font-semibold">{qty(stock)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-ok/15 px-2.5 py-1 font-semibold text-ok">{board.counts.pidieron} confirmados</span>
            <span className="rounded-full bg-card-2 px-2.5 py-1 font-semibold text-tinta-2">{board.counts.borrador} en borrador</span>
            <span className="rounded-full bg-card-2 px-2.5 py-1 font-semibold text-tinta-2">{board.counts.noPiden} no piden</span>
            <span className="rounded-full bg-mal/15 px-2.5 py-1 font-semibold text-mal">{board.counts.sinRespuesta} sin respuesta</span>
          </div>
        </Card>

        {/* Agenda */}
        <Card>
          <CardTitle
            action={
              <Link href="/admin/programacion" className="text-sm font-semibold text-acento hover:underline">
                Semana
              </Link>
            }
          >
            Hoy y mañana
          </CardTitle>
          <ul className="space-y-1">
            {today.map((t) => (
              <li key={t.id}>
                <button onClick={() => dispatch({ type: "toggleTask", id: t.id })} className="flex w-full cursor-pointer items-start gap-3 rounded-xl p-2 text-left hover:bg-card-2">
                  {t.done ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-ok" /> : <Circle className="mt-0.5 size-5 shrink-0 text-tinta-2" />}
                  <span className={t.done ? "text-tinta-2 line-through" : ""}>
                    {t.title}
                    <span className="block text-xs text-tinta-2 no-underline">
                      {dayShort(t.day)} · {TASK_LABEL[t.kind]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-oro/10 p-3 text-sm text-oro-claro">
            <Clock className="size-4 shrink-0" /> Corte: jueves 6:00 p. m.
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardTitle
            action={
              <Link href="/admin/finanzas" className="text-sm font-semibold text-acento hover:underline">
                Finanzas
              </Link>
            }
          >
            Ingresos vs. egresos por semana
          </CardTitle>
          <GroupedBars
            caption="Ingresos y egresos de las últimas 5 semanas"
            data={series.map((s) => ({ label: dayShort(s.week.startsOn), values: [s.income, s.expense] }))}
            series={[
              { name: "Ingresos", color: "var(--color-serie-1)" },
              { name: "Egresos", color: "var(--color-serie-2)" },
            ]}
          />
        </Card>

        <div className="flex flex-col gap-4">
          {(low.length > 0 || newReq.length > 0) && (
            <Card className="border-oro/30">
              <CardTitle>Pendientes</CardTitle>
              <ul className="space-y-2 text-sm">
                {newReq.length > 0 && (
                  <li>
                    <Link href="/admin/usuarios" className="flex items-center gap-3 rounded-xl bg-card-2 p-3 hover:brightness-110">
                      <Inbox className="size-5 text-oro" />
                      <span className="flex-1">
                        <b>{newReq.length}</b> solicitudes de clientes nuevos
                      </span>
                      <ArrowRight className="size-4 text-tinta-2" />
                    </Link>
                  </li>
                )}
                {low.map((l) => (
                  <li key={l.product.id}>
                    <Link href="/admin/inventario" className="flex items-center gap-3 rounded-xl bg-card-2 p-3 hover:brightness-110">
                      <AlertTriangle className="size-5 text-mal" />
                      <span className="flex-1">
                        Stock bajo: <b>{l.product.name}</b> ({qty(l.stock)})
                      </span>
                      <ArrowRight className="size-4 text-tinta-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardTitle>
              Por cobrar <span className="tabular ml-1 font-sans text-base font-semibold text-mal">{money(debts.reduce((a, d) => a + d.amount, 0))}</span>
            </CardTitle>
            {debts.length === 0 ? (
              <p className="text-sm text-tinta-2">Nadie debe. 🙌</p>
            ) : (
              <ul className="divide-y divide-linea text-sm">
                {debts.map((d) => (
                  <li key={d.order.id} className="flex items-center justify-between gap-2 py-2.5">
                    <span>
                      {d.customer.businessName ?? d.customer.fullName}
                      <span className="block text-xs text-tinta-2">{d.customer.municipality}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <b className="tabular">{money(d.amount)}</b>
                      <button
                        onClick={() => dispatch({ type: "setOrderPaid", orderId: d.order.id, paid: true })}
                        className="cursor-pointer rounded-lg bg-ok/15 px-2 py-1 text-xs font-semibold text-ok hover:bg-ok/25"
                      >
                        Pagó
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Link href="/admin/produccion" className="flex items-center gap-3 rounded-[var(--radius-card)] bg-oro p-4 font-semibold text-noche transition hover:bg-oro-claro active:scale-[.98]">
            <Flame className="size-5" /> Registrar producción de hoy <ArrowRight className="ml-auto size-5" />
          </Link>
        </div>
      </div>
    </>
  );
}
