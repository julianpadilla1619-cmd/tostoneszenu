"use client";

import { useMemo, useState } from "react";
import { ChevronRight, CircleDollarSign, Pencil, Plus, Search, Truck } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, Empty, Input, Pill, Segmented, Select, Sheet, StatusBadge, Stepper, Textarea, useToast } from "@/components/ui/ui";
import { dayShort, money, qty, weekRange } from "@/lib/format";
import { METHOD_LABEL, ROLE_LABEL, STATUS_FLOW, STATUS_LABEL } from "@/lib/labels";
import { CURRENT_WEEK_ID } from "@/lib/mock-data";
import { orderPacks, orderTotal, weekBoard } from "@/lib/selectors";
import { priceFor, useStore } from "@/lib/store";
import type { Order, OrderStatus, PaymentMethod, Profile } from "@/lib/types";

type Filter = "todos" | "activos" | "borrador" | "no_pide" | "sin" | "por_cobrar";

export default function AdminPedidos() {
  const { state, dispatch, saveOrder } = useStore();
  const [toast, showToast] = useToast();
  const [weekId, setWeekId] = useState(CURRENT_WEEK_ID);
  const [filter, setFilter] = useState<Filter>("todos");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);

  const week = state.weeks.find((w) => w.id === weekId)!;
  const board = weekBoard(state, weekId);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return board.rows
      .filter(({ customer: c }) => !term || `${c.fullName} ${c.businessName ?? ""} ${c.municipality}`.toLowerCase().includes(term))
      .filter(({ order: o }) => {
        if (filter === "todos") return true;
        if (filter === "sin") return !o || o.status === "cancelado";
        if (filter === "activos") return o && STATUS_FLOW.includes(o.status);
        if (filter === "por_cobrar") return o?.status === "entregado" && !o.paid;
        return o?.status === filter;
      })
      .sort((a, b) => (b.order ? orderTotal(b.order) : -1) - (a.order ? orderTotal(a.order) : -1));
  }, [board.rows, filter, q]);

  function advance(o: Order) {
    const i = STATUS_FLOW.indexOf(o.status);
    const next = STATUS_FLOW[i + 1];
    if (!next) return;
    dispatch({ type: "setOrderStatus", orderId: o.id, status: next });
    if (next === "en_camino") showToast("Pedido en camino · se envió notificación al cliente");
  }

  function bulk(from: OrderStatus, to: OrderStatus) {
    const targets = board.rows.filter((r) => r.order?.status === from);
    targets.forEach((r) => dispatch({ type: "setOrderStatus", orderId: r.order!.id, status: to }));
    showToast(`${targets.length} pedidos → ${STATUS_LABEL[to]}${to === "en_camino" ? " · clientes notificados" : ""}`);
  }

  const count = (s: OrderStatus) => board.rows.filter((r) => r.order?.status === s).length;

  return (
    <>
      <PageHead title="Pedidos" sub={`Semana ${weekRange(week.startsOn)} · entrega ${dayShort(week.deliveryOn)}`} />

      <Segmented
        className="mb-4"
        value={weekId}
        onChange={setWeekId}
        options={[...state.weeks].reverse().map((w) => ({ value: w.id, label: w.id === CURRENT_WEEK_ID ? "Esta semana" : weekRange(w.startsOn) }))}
      />

      {/* Consolidado */}
      <div className="grid gap-3 sm:grid-cols-3">
        {board.byProduct.map((b) => (
          <Card key={b.product.id} className="flex items-center gap-4">
            <ProductArt kind={b.product.kind} className="size-14 shrink-0" />
            <div>
              <p className="text-sm text-tinta-2">{b.product.name}</p>
              <p className="tabular font-display text-3xl font-black text-oro">{qty(b.qty)}</p>
              <p className="tabular text-xs text-tinta-2">{money(b.value)}</p>
            </div>
          </Card>
        ))}
        <Card className="flex flex-col justify-center bg-oro text-noche">
          <p className="text-sm font-semibold opacity-75">Total semana</p>
          <p className="tabular font-display text-3xl font-black">{qty(board.totalPacks)} paq.</p>
          <p className="tabular text-sm font-semibold">{money(board.totalValue)}</p>
        </Card>
      </div>

      {/* Acciones masivas */}
      <div className="scroll-x -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        <Button size="sm" variant="suave" disabled={!count("confirmado")} onClick={() => bulk("confirmado", "en_produccion")}>
          Confirmados → producción ({count("confirmado")})
        </Button>
        <Button size="sm" variant="suave" disabled={!count("en_produccion")} onClick={() => bulk("en_produccion", "en_camino")} icon={<Truck className="size-4" />}>
          Despachar ({count("en_produccion")})
        </Button>
        <Button size="sm" variant="suave" disabled={!count("en_camino")} onClick={() => bulk("en_camino", "entregado")}>
          Marcar entregados ({count("en_camino")})
        </Button>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tinta-2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente o municipio" className="pl-10" aria-label="Buscar" />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todos", label: `Todos (${board.rows.length})` },
            { value: "activos", label: `Pidieron (${board.counts.pidieron})` },
            { value: "borrador", label: "Borrador" },
            { value: "no_pide", label: "No piden" },
            { value: "sin", label: `Sin respuesta (${board.counts.sinRespuesta})` },
            { value: "por_cobrar", label: "Por cobrar" },
          ]}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.length === 0 && <Empty title="Nada por aquí" />}
        {rows.map(({ customer: c, order: o }) => {
          const next = o ? STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1] : undefined;
          const hasItems = o && o.items.length > 0 && o.status !== "cancelado";
          return (
            <li key={c.id}>
              <Card as="article" className="p-3.5 sm:p-4">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.businessName ?? c.fullName}</p>
                      <Pill className="!py-0.5 text-[0.68rem]">{ROLE_LABEL[c.role]}</Pill>
                    </div>
                    <p className="text-xs text-tinta-2">
                      {c.businessName ? `${c.fullName} · ` : ""}
                      {c.municipality}
                    </p>
                    {hasItems && (
                      <p className="tabular mt-1.5 text-sm text-tinta-2">
                        {o!.items.map((i) => `${qty(i.qty)} ${state.products.find((p) => p.id === i.productId)?.kind === "toston" ? "tostones" : "papas"}`).join(" · ")}
                      </p>
                    )}
                    {o?.note && <p className="mt-1 rounded-lg bg-card-2 px-2 py-1 text-xs text-tinta-2">“{o.note}”</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={o && o.status !== "cancelado" ? o.status : "sin_pedido"} />
                    {hasItems && <p className="tabular font-display text-lg font-bold">{money(orderTotal(o!))}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-linea pt-3">
                  {o?.status === "entregado" && (
                    <PaidToggle order={o} onChange={(paid, method) => dispatch({ type: "setOrderPaid", orderId: o.id, paid, method })} />
                  )}
                  {o && next && hasItems && (
                    <Button size="sm" variant="oro" onClick={() => advance(o)} icon={<ChevronRight className="size-4" />}>
                      {STATUS_LABEL[next]}
                    </Button>
                  )}
                  {(!o || ["borrador", "confirmado", "no_pide", "cancelado"].includes(o.status)) && (
                    <Button size="sm" variant="borde" onClick={() => setEditing(c)} icon={o && hasItems ? <Pencil className="size-4" /> : <Plus className="size-4" />}>
                      {o && hasItems ? "Editar" : "Crear pedido"}
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
          key={editing.id + weekId}
          customer={editing}
          order={state.orders.find((o) => o.customerId === editing.id && o.weekId === weekId)}
          onClose={() => setEditing(null)}
          onSave={(qtys, note) => {
            saveOrder(editing.id, weekId, qtys, note, "confirmado");
            setEditing(null);
            showToast("Pedido guardado");
          }}
        />
      )}
      {toast}
    </>
  );
}

function PaidToggle({ order, onChange }: { order: Order; onChange: (paid: boolean, method?: PaymentMethod) => void }) {
  if (order.paid)
    return (
      <button onClick={() => onChange(false)} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-ok/15 px-3 text-sm font-semibold text-ok">
        <CircleDollarSign className="size-4" /> Pagado · {METHOD_LABEL[order.paymentMethod ?? "efectivo"]}
      </button>
    );
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-mal">Sin pagar</span>
      <Select aria-label="Método de pago" className="!h-9 !w-auto !rounded-xl !pl-3 text-sm" defaultValue="" onChange={(e) => e.target.value && onChange(true, e.target.value as PaymentMethod)}>
        <option value="">Registrar pago…</option>
        {Object.entries(METHOD_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
    </div>
  );
}

function OrderEditor({
  customer,
  order,
  onClose,
  onSave,
}: {
  customer: Profile;
  order?: Order;
  onClose: () => void;
  onSave: (qtys: Record<string, number>, note?: string) => void;
}) {
  const { state } = useStore();
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(state.products.map((p) => [p.id, order?.items.find((i) => i.productId === p.id)?.qty ?? 0])),
  );
  const [note, setNote] = useState(order?.note ?? "");
  const total = state.products.reduce((a, p) => a + (qtys[p.id] ?? 0) * priceFor(p, customer.role), 0);
  return (
    <Sheet open onClose={onClose} title={customer.businessName ?? customer.fullName}>
      <div className="flex flex-col gap-3 pb-4">
        {state.products.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3">
            <div className="flex items-center gap-3">
              <ProductArt kind={p.kind} className="size-10" />
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="tabular text-xs text-tinta-2">{money(priceFor(p, customer.role))}</p>
              </div>
            </div>
            <Stepper label={p.name} value={qtys[p.id] ?? 0} step={customer.role === "mayorista" ? 10 : 1} onChange={(n) => setQtys((s) => ({ ...s, [p.id]: n }))} />
          </div>
        ))}
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" aria-label="Nota" />
        <Button size="lg" onClick={() => onSave(qtys, note)} disabled={total === 0}>
          Guardar · {money(total)}
        </Button>
      </div>
    </Sheet>
  );
}
