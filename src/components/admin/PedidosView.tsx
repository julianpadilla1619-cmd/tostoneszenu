"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, CircleDollarSign, Pencil, Plus, Search, Truck } from "lucide-react";
import { adminSaveOrder, setOrderPaid, setOrdersStatus } from "@/app/actions/admin";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, Empty, FormError, Input, Segmented, Select, Sheet, Spinner, StatusBadge, Stepper, Textarea, useToast } from "@/components/ui/ui";
import { dayLong, dayShort, money, qty } from "@/lib/format";
import { METHOD_LABEL, STATUS_FLOW, STATUS_LABEL } from "@/lib/labels";
import { consolidate, isActive, orderPacks, orderTotal } from "@/lib/selectors";
import type { ActionResult, Order, OrderStatus, PaymentMethod, Product, Profile } from "@/lib/types";

type Filter = "todos" | "activos" | "no_pide" | "sin" | "por_cobrar";

export function PedidosView({
  weekStart,
  deliveries,
  products,
  orders,
  customers,
}: {
  weekStart: string;
  deliveries: string[];
  products: Product[];
  orders: Order[];
  customers: Profile[];
}) {
  const [toast, showToast] = useToast();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<Filter>("todos");
  const [day, setDay] = useState<string>("todos");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const dayOrders = day === "todos" ? orders : orders.filter((o) => o.deliveryOn === day);
  const board = consolidate(dayOrders, products);

  const rows = customers
    .map((c) => ({ customer: c, order: orders.find((o) => o.customerId === c.id) }))
    .filter(({ order }) => day === "todos" || order?.deliveryOn === day)
    .filter(({ customer: c }) => !q.trim() || `${c.fullName} ${c.businessName ?? ""} ${c.municipality ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter(({ order: o }) => {
      if (filter === "todos") return true;
      if (filter === "sin") return !o || o.status === "cancelado";
      if (filter === "activos") return !!o && isActive(o);
      if (filter === "por_cobrar") return o?.status === "entregado" && !o.paid;
      return o?.status === filter;
    })
    .sort((a, b) => (b.order ? orderTotal(b.order) : -1) - (a.order ? orderTotal(a.order) : -1));

  const ids = (s: OrderStatus) => dayOrders.filter((o) => o.status === s).map((o) => o.id);
  const handle = (p: Promise<ActionResult<unknown>>) =>
    start(async () => {
      const r = await p;
      if (r.ok) {
        setError(null);
        if (r.message) showToast(r.message);
      } else setError(r.error);
    });

  return (
    <>
      {deliveries.length > 1 && (
        <Segmented
          className="mb-4"
          value={day}
          onChange={setDay}
          options={[{ value: "todos", label: "Toda la semana" }, ...deliveries.map((d) => ({ value: d, label: dayLong(d) }))]}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {board.byProduct
          .filter((b) => b.qty > 0)
          .map((b) => (
            <Card key={b.product.id} className="flex items-center gap-4">
              <ProductArt kind={b.product.category} className="size-12 shrink-0" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm leading-tight text-tinta-2">{b.product.name}</p>
                <p className="tabular font-display text-3xl font-black text-oro">{qty(b.qty)}</p>
                <p className="tabular text-xs text-tinta-2">{money(b.value)}</p>
              </div>
            </Card>
          ))}
        <Card className="flex flex-col justify-center bg-oro text-noche">
          <p className="text-sm font-semibold opacity-80">Total {day === "todos" ? "de la semana" : dayShort(day)}</p>
          <p className="tabular font-display text-3xl font-black">{qty(board.totalPacks)} paq.</p>
          <p className="tabular text-sm font-semibold">{money(board.totalValue)}</p>
        </Card>
      </div>

      <div className="scroll-x -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Cambiar estado de varios pedidos">
        <Button size="sm" variant="suave" disabled={pending || !ids("confirmado").length} onClick={() => handle(setOrdersStatus(ids("confirmado"), "en_produccion"))}>
          Confirmados → producción ({ids("confirmado").length})
        </Button>
        <Button size="sm" variant="suave" disabled={pending || !ids("en_produccion").length} onClick={() => handle(setOrdersStatus(ids("en_produccion"), "en_camino"))} icon={<Truck className="size-4" aria-hidden />}>
          Despachar y avisar ({ids("en_produccion").length})
        </Button>
        <Button size="sm" variant="suave" disabled={pending || !ids("en_camino").length} onClick={() => handle(setOrdersStatus(ids("en_camino"), "entregado"))}>
          Marcar entregados ({ids("en_camino").length})
        </Button>
      </div>
      <FormError message={error} />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tinta-2" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente o municipio" className="pl-10" aria-label="Buscar cliente" type="search" />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todos", label: "Todos" },
            { value: "activos", label: "Pidieron" },
            { value: "no_pide", label: "No piden" },
            { value: "sin", label: "Sin respuesta" },
            { value: "por_cobrar", label: "Por cobrar" },
          ]}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.length === 0 && (
          <li>
            <Empty title="Nada por aquí">{customers.length === 0 ? "Primero crea clientes en la sección Clientes." : "Prueba con otro filtro."}</Empty>
          </li>
        )}
        {rows.map(({ customer: c, order: o }) => {
          const hasItems = !!o && o.items.length > 0 && o.status !== "cancelado";
          const next = o ? STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1] : undefined;
          return (
            <li key={c.id}>
              <Card as="article" className="p-3.5 sm:p-4">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.businessName ?? c.fullName}</p>
                    <p className="text-xs text-tinta-2">
                      {c.businessName ? `${c.fullName} · ` : ""}
                      {c.municipality ?? ""}
                      {o?.deliveryOn ? ` · entrega ${dayShort(o.deliveryOn)}` : ""}
                    </p>
                    {hasItems && (
                      <p className="tabular mt-1.5 text-sm text-tinta-2">
                        {o!.items.map((i) => `${qty(i.qty)} ${productById.get(i.productId)?.name.toLowerCase() ?? "producto"}`).join(" · ")}
                      </p>
                    )}
                    {o?.note && <p className="mt-1.5 rounded-lg bg-card-2 px-2 py-1 text-xs text-tinta-2">“{o.note}”</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={o && o.status !== "cancelado" ? o.status : "sin_pedido"} />
                    {hasItems && <p className="tabular font-display text-lg font-bold">{money(orderTotal(o!))}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-linea pt-3">
                  {o?.status === "entregado" && <PaidControl order={o} onChange={(paid, m) => handle(setOrderPaid(o.id, paid, m))} disabled={pending} />}
                  {o && next && hasItems && (
                    <Button size="sm" disabled={pending} onClick={() => handle(setOrdersStatus([o.id], next))} icon={<ChevronRight className="size-4" aria-hidden />}>
                      {STATUS_LABEL[next]}
                    </Button>
                  )}
                  {(!o || ["borrador", "confirmado", "no_pide", "cancelado"].includes(o.status)) && c.status === "activo" && (
                    <Button size="sm" variant="borde" onClick={() => setEditing(c)} icon={hasItems ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}>
                      {hasItems ? "Editar" : "Crear pedido"}
                    </Button>
                  )}
                  {hasItems && <span className="tabular ml-auto text-xs text-tinta-2">{qty(orderPacks(o!))} paq.</span>}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {editing && (
        <OrderEditor
          key={editing.id}
          customer={editing}
          order={orders.find((o) => o.customerId === editing.id)}
          products={products.filter((p) => p.active)}
          deliveries={deliveries}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            const r = await adminSaveOrder({ ...input, customerId: editing.id, weekStart });
            if (r.ok) {
              setEditing(null);
              showToast(r.message ?? "Pedido guardado");
            }
            return r.ok ? null : r.error;
          }}
        />
      )}
      {toast}
    </>
  );
}

function PaidControl({ order, onChange, disabled }: { order: Order; onChange: (paid: boolean, method?: PaymentMethod) => void; disabled: boolean }) {
  if (order.paid)
    return (
      <button
        disabled={disabled}
        onClick={() => window.confirm("¿Quitar el pago de este pedido?") && onChange(false)}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-ok/15 px-3 text-sm font-semibold text-ok"
      >
        <CircleDollarSign className="size-4" aria-hidden /> Pagado · {METHOD_LABEL[order.paymentMethod ?? "efectivo"]}
      </button>
    );
  return (
    <Select
      aria-label="Registrar pago"
      disabled={disabled}
      className="!h-9 !w-auto !rounded-xl !pl-3 text-sm"
      defaultValue=""
      onChange={(e) => e.target.value && onChange(true, e.target.value as PaymentMethod)}
    >
      <option value="">Sin pagar · registrar pago…</option>
      {Object.entries(METHOD_LABEL).map(([k, v]) => (
        <option key={k} value={k}>
          Pagó con {v.toLowerCase()}
        </option>
      ))}
    </Select>
  );
}

function OrderEditor({
  customer,
  order,
  products,
  deliveries,
  onClose,
  onSave,
}: {
  customer: Profile;
  order?: Order;
  products: Product[];
  deliveries: string[];
  onClose: () => void;
  onSave: (input: { deliveryOn: string; items: { productId: string; qty: number }[]; note?: string }) => Promise<string | null>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>(() => Object.fromEntries(products.map((p) => [p.id, order?.items.find((i) => i.productId === p.id)?.qty ?? 0])));
  const [delivery, setDelivery] = useState(order?.deliveryOn ?? deliveries[0] ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const total = products.reduce((a, p) => a + (qtys[p.id] ?? 0) * p.price, 0);
  return (
    <Sheet open onClose={onClose} title={customer.businessName ?? customer.fullName}>
      <div className="flex flex-col gap-3 pb-4">
        <Select value={delivery} onChange={(e) => setDelivery(e.target.value)} aria-label="Día de entrega">
          {deliveries.map((d) => (
            <option key={d} value={d}>
              Entrega: {dayLong(d)}
            </option>
          ))}
        </Select>
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProductArt kind={p.category} className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="tabular text-xs text-tinta-2">{money(p.price)}</p>
              </div>
            </div>
            <Stepper label={p.name} value={qtys[p.id] ?? 0} onChange={(n) => setQtys((s) => ({ ...s, [p.id]: n }))} />
          </div>
        ))}
        <Textarea rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" aria-label="Nota" />
        <p className="text-xs text-tinta-2">Como admin puedes guardar pedidos fuera de la hora límite y con menos del mínimo. Al cliente le llega un aviso.</p>
        <FormError message={error} />
        <Button
          size="lg"
          disabled={total === 0 || pending}
          icon={pending ? <Spinner /> : undefined}
          onClick={() =>
            start(async () => {
              setError(await onSave({ deliveryOn: delivery, items: products.map((p) => ({ productId: p.id, qty: qtys[p.id] ?? 0 })), note }));
            })
          }
        >
          Guardar · {money(total)}
        </Button>
      </div>
    </Sheet>
  );
}
