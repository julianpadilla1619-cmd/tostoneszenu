import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { deleteRow } from "@/app/actions/admin";
import { PageHead } from "@/components/admin/AdminShell";
import { BatchForm } from "@/components/admin/BatchForm";
import { ProductArt } from "@/components/brand/Brand";
import { ActionButton } from "@/components/shared/ActionButton";
import { Card, CardTitle, Empty, Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminProducts, getCatalog, inventoryView, ordersBetween, productionBatches } from "@/lib/data";
import { dayLabel, money, qty } from "@/lib/format";
import { consolidate, pendingDelivery } from "@/lib/selectors";
import { orderWindow, todayBogota } from "@/lib/time";

export default function ProduccionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Produccion />
    </Suspense>
  );
}

async function Produccion() {
  await requirePage(["admin"]);
  const { settings } = await getCatalog();
  const win = orderWindow(settings);
  const [products, inv, batches, weekOrders] = await Promise.all([adminProducts(), inventoryView(), productionBatches(), ordersBetween(win.weekStart, win.weekStart)]);
  const committed = new Map(consolidate(pendingDelivery(weekOrders), products).byProduct.map((b) => [b.product.id, b.qty]));
  const name = new Map(products.map((p) => [p.id, p]));
  const shown = products.filter((p) => p.active || inv.some((r) => r.product_id === p.id && r.produced > 0));

  return (
    <>
      <PageHead title="Producción e inventario" sub="Inventario = producido − merma − entregado (+ ajustes)." />

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => {
          const r = inv.find((x) => x.product_id === p.id) ?? { produced: 0, waste: 0, sold: 0, adjustments: 0 };
          const stock = r.produced - r.waste - r.sold + r.adjustments;
          const need = committed.get(p.id) ?? 0;
          const low = stock <= p.lowStockThreshold;
          return (
            <li key={p.id}>
              <Card>
                <div className="flex items-center gap-3">
                  <ProductArt kind={p.category} className="size-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-display text-lg font-bold leading-tight">{p.name}</p>
                    <p className="text-xs text-tinta-2">{p.weightGrams} g</p>
                  </div>
                  {low ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mal/15 px-2.5 py-1 text-xs font-semibold text-mal">
                      <AlertTriangle className="size-3.5" aria-hidden /> Poco
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Bien
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-tinta-2">En bodega</p>
                    <p className="tabular font-display text-4xl font-black text-oro">{qty(stock)}</p>
                  </div>
                  <p className="tabular text-right text-xs text-tinta-2">
                    Valor a costo
                    <b className="block text-base text-tinta">{money(Math.max(0, stock) * p.unitCost)}</b>
                  </p>
                </div>
                <dl className="tabular mt-3 grid grid-cols-4 gap-1 border-t border-linea pt-3 text-center text-xs">
                  {(
                    [
                      ["Producido", r.produced, ""],
                      ["Merma", r.waste, "text-mal"],
                      ["Entregado", r.sold, ""],
                      ["Por entregar", need, ""],
                    ] as const
                  ).map(([k, v, cls]) => (
                    <div key={k}>
                      <dt className="text-tinta-2">{k}</dt>
                      <dd className={"mt-0.5 text-sm font-bold " + cls}>{qty(v)}</dd>
                    </div>
                  ))}
                </dl>
                {need > stock && (
                  <p className="mt-3 rounded-xl bg-mal/10 px-3 py-2 text-sm text-rojo-claro">
                    Faltan <b>{qty(need - Math.max(stock, 0))}</b> paquetes para los pedidos de esta semana.
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardTitle>Registrar lo que se fritó</CardTitle>
          <BatchForm products={products.filter((p) => p.active)} today={todayBogota()} />
        </Card>
        <Card>
          <CardTitle>Últimos lotes</CardTitle>
          {batches.length === 0 ? (
            <Empty title="Sin lotes todavía">Registra cada producción para llevar el inventario al día.</Empty>
          ) : (
            <ul className="divide-y divide-linea">
              {batches.map((b) => {
                const p = name.get(b.productId);
                return (
                  <li key={b.id} className="flex min-h-14 items-center gap-3 py-2.5">
                    <ProductArt kind={p?.category ?? "platano"} className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p?.name ?? "Producto"}</p>
                      <p className="truncate text-xs text-tinta-2">
                        {dayLabel(b.producedOn)}
                        {b.notes ? ` · ${b.notes}` : ""}
                      </p>
                    </div>
                    <div className="tabular text-right text-sm">
                      <p className="font-semibold">{qty(b.unitsProduced)}</p>
                      {b.unitsWaste > 0 && <p className="text-xs text-mal">−{qty(b.unitsWaste)} merma</p>}
                    </div>
                    <ActionButton variant="fantasma" confirm="¿Eliminar este lote?" action={deleteRow.bind(null, "production_batches", b.id)} icon={<Trash2 className="size-4" aria-hidden />}>
                      <span className="sr-only">Eliminar lote</span>
                    </ActionButton>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
