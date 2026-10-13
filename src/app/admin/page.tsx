import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, Clock, Inbox, PackageOpen, TrendingUp, Users, UserX } from "lucide-react";
import { setOrderPaid } from "@/app/actions/admin";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { GroupedBars } from "@/components/charts/Charts";
import { ActionButton } from "@/components/shared/ActionButton";
import { Card, CardTitle, Skeleton, Stat } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminProducts, deliveredOrders, expensesBetween, getCatalog, incomesBetween, inventoryView, ordersBetween, profilesByRole, signupRequests } from "@/lib/data";
import { addDays, dayLong, dayShort, money, plural, qty } from "@/lib/format";
import { periodRange } from "@/lib/periods";
import { consolidate, isActive, orderTotal, pendingDelivery, weeklySeries } from "@/lib/selectors";
import { mondayOf, orderWindow, timeLeft, todayBogota } from "@/lib/time";

export default function AdminResumen() {
  return (
    <Suspense fallback={<ResumenSkeleton />}>
      <Resumen />
    </Suspense>
  );
}

async function Resumen() {
  await requirePage(["admin"]);
  const { settings } = await getCatalog();
  const today = todayBogota();
  const win = orderWindow(settings);
  const thisMonday = mondayOf(today);
  const month = periodRange("mes", today);
  const seriesFrom = addDays(thisMonday, -35);

  const [products, weekOrders, customers, requests, delivered, inv, incomes, expenses] = await Promise.all([
    adminProducts(),
    ordersBetween(win.weekStart, win.weekStart),
    profilesByRole(["mayorista"]),
    signupRequests("nueva"),
    deliveredOrders(),
    inventoryView(),
    incomesBetween(seriesFrom < month.from ? seriesFrom : month.from, addDays(thisMonday, 6)),
    expensesBetween(seriesFrom < month.from ? seriesFrom : month.from, addDays(thisMonday, 6)),
  ]);

  const active = customers.filter((c) => c.status === "activo");
  const board = consolidate(weekOrders, products);
  const toMake = consolidate(pendingDelivery(weekOrders), products);
  const answered = new Set(weekOrders.filter((o) => o.status !== "cancelado").map((o) => o.customerId));
  const silent = active.filter((c) => !answered.has(c.id));
  const asked = weekOrders.filter(isActive).length;
  const monthNet = incomes.filter((i) => i.receivedOn >= month.from).reduce((a, i) => a + i.amount, 0) - expenses.filter((e) => e.spentOn >= month.from).reduce((a, e) => a + e.amount, 0);
  const debts = delivered.filter((o) => !o.paid);
  const nameOf = new Map(customers.map((c) => [c.id, c.businessName ?? c.fullName]));
  const stock = new Map(inv.map((r) => [r.product_id, r.produced - r.waste - r.sold + r.adjustments]));
  const low = products.filter((p) => p.active && (stock.get(p.id) ?? 0) <= p.lowStockThreshold && (stock.get(p.id) ?? 0) > 0);
  const series = weeklySeries(incomes, expenses, thisMonday, 6);
  const next = win.open[0];

  return (
    <>
      <PageHead title="Resumen" sub={`Semana del ${dayShort(win.weekStart)}${next ? ` · ${timeLeft(next.cutoff)} para el corte del ${dayShort(next.date)}` : ""}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pidieron" value={`${asked}/${active.length}`} sub={`${silent.length} sin responder`} icon={<Users className="size-4" aria-hidden />} />
        <Stat label="Paquetes" value={qty(board.totalPacks)} sub="pedidos esta semana" icon={<PackageOpen className="size-4" aria-hidden />} tone="oro" />
        <Stat label="Ventas semana" value={money(board.totalValue)} sub="si se entrega todo" icon={<TrendingUp className="size-4" aria-hidden />} />
        <Stat label="Ganancia del mes" value={money(monthNet)} sub="ingresos − gastos" tone={monthNet >= 0 ? "ok" : "mal"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardTitle
            action={
              <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-acento hover:underline">
                Ver pedidos <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            Qué producir
          </CardTitle>
          {toMake.totalPacks === 0 ? (
            <p className="rounded-2xl bg-card-2 p-4 text-sm text-tinta-2">
              {board.totalPacks ? "Todo lo de esta semana ya se entregó." : "Todavía no hay pedidos confirmados para esta semana."}
            </p>
          ) : (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                {toMake.byProduct
                  .filter((b) => b.qty > 0)
                  .map((b) => {
                    const s = Math.max(0, stock.get(b.product.id) ?? 0);
                    return (
                      <li key={b.product.id} className="rounded-2xl bg-card-2 p-4">
                        <div className="flex items-center gap-3">
                          <ProductArt kind={b.product.category} className="size-10" />
                          <p className="font-semibold leading-tight">{b.product.name}</p>
                        </div>
                        <p className="tabular mt-3 font-display text-4xl font-black text-oro">{qty(Math.max(0, b.qty - s))}</p>
                        <p className="text-xs text-tinta-2">
                          por fritar · por entregar {qty(b.qty)} · en bodega {qty(s)}
                        </p>
                      </li>
                    );
                  })}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                {toMake.byDay.map((d) => (
                  <li key={d.date} className="rounded-full bg-oro/12 px-3 py-1.5 font-semibold text-oro-claro">
                    {dayLong(d.date)}: {plural(d.orders, "pedido", "pedidos")} · {qty(d.packs)} paq.
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {(requests.length > 0 || low.length > 0) && (
            <Card className="border-oro/30">
              <CardTitle>Pendientes</CardTitle>
              <ul className="space-y-2 text-sm">
                {requests.length > 0 && (
                  <li>
                    <Link href="/admin/clientes" className="flex min-h-12 items-center gap-3 rounded-xl bg-card-2 p-3 hover:brightness-110">
                      <Inbox className="size-5 text-oro" aria-hidden />
                      <span className="flex-1">
                        <b>{requests.length}</b> {requests.length === 1 ? "solicitud nueva" : "solicitudes nuevas"} de clientes
                      </span>
                      <ArrowRight className="size-4 text-tinta-2" aria-hidden />
                    </Link>
                  </li>
                )}
                {low.map((p) => (
                  <li key={p.id}>
                    <Link href="/admin/produccion" className="flex min-h-12 items-center gap-3 rounded-xl bg-card-2 p-3 hover:brightness-110">
                      <AlertTriangle className="size-5 text-mal" aria-hidden />
                      <span className="flex-1">
                        Poco inventario: <b>{p.name}</b> ({qty(stock.get(p.id) ?? 0)})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardTitle>Sin responder esta semana</CardTitle>
            {silent.length === 0 ? (
              <p className="text-sm text-tinta-2">Todos los clientes respondieron.</p>
            ) : (
              <ul className="divide-y divide-linea text-sm">
                {silent.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex min-h-12 items-center justify-between gap-2 py-2">
                    <span className="flex items-center gap-2">
                      <UserX className="size-4 text-tinta-2" aria-hidden />
                      {c.businessName ?? c.fullName}
                    </span>
                    {c.phone && (
                      <a
                        className="rounded-lg bg-ok/15 px-2.5 py-1.5 text-xs font-semibold text-ok"
                        href={`https://wa.me/57${c.phone}?text=${encodeURIComponent("¡Hola! ¿Cuántos paquetes de Tostones Zenú te mandamos esta semana?")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {next && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-oro/10 p-3 text-sm text-oro-claro">
                <Clock className="size-4 shrink-0" aria-hidden /> El día antes de cada entrega les llega un recordatorio automático.
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardTitle>Ingresos vs. gastos por semana</CardTitle>
          <GroupedBars
            caption="Ingresos y gastos de las últimas 6 semanas"
            data={series.map((s) => ({ label: dayShort(s.from), values: [s.income, s.expense] }))}
            series={[
              { name: "Ingresos", color: "var(--color-serie-1)" },
              { name: "Gastos", color: "var(--color-serie-2)" },
            ]}
          />
        </Card>
        <Card>
          <CardTitle>
            Por cobrar <span className="tabular ml-1 font-sans text-base font-semibold text-mal">{money(debts.reduce((a, o) => a + orderTotal(o), 0))}</span>
          </CardTitle>
          {debts.length === 0 ? (
            <p className="text-sm text-tinta-2">Nadie debe. Todo al día.</p>
          ) : (
            <ul className="divide-y divide-linea text-sm">
              {debts.map((o) => (
                <li key={o.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {nameOf.get(o.customerId) ?? "Cliente"}
                    <span className="block text-xs text-tinta-2">{o.deliveryOn ? dayShort(o.deliveryOn) : ""}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <b className="tabular">{money(orderTotal(o))}</b>
                    <ActionButton action={setOrderPaid.bind(null, o.id, true, "efectivo")}>Pagó</ActionButton>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function ResumenSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
