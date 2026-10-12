// Cálculos de negocio puros (consolidado, inventario, finanzas, reparto).
// En Supabase equivalen a las vistas v_weekly_consolidated, v_inventory y finance_summary().
import { addDays } from "./format";
import { CURRENT_WEEK_ID } from "./mock-data";
import type { State } from "./store";
import type { Income, Order, OrderStatus, Profile } from "./types";

export const ACTIVE_STATUSES: OrderStatus[] = ["confirmado", "en_produccion", "en_camino", "entregado"];

export const orderTotal = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const orderPacks = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty, 0);

export const currentWeek = (s: State) => s.weeks.find((w) => w.id === CURRENT_WEEK_ID)!;
export const isCustomer = (p: Profile) => p.role === "mayorista" || p.role === "regular";

export function weekBoard(s: State, weekId: string) {
  const customers = s.profiles.filter((p) => isCustomer(p) && p.status === "activo");
  const orders = s.orders.filter((o) => o.weekId === weekId);
  const rows = customers.map((c) => ({ customer: c, order: orders.find((o) => o.customerId === c.id) }));
  const active = rows.filter((r) => r.order && ACTIVE_STATUSES.includes(r.order.status));
  const byProduct = s.products.map((p) => {
    const items = active.flatMap((r) => r.order!.items).filter((i) => i.productId === p.id);
    return { product: p, qty: items.reduce((a, i) => a + i.qty, 0), value: items.reduce((a, i) => a + i.qty * i.unitPrice, 0) };
  });
  return {
    rows,
    byProduct,
    totalPacks: byProduct.reduce((a, b) => a + b.qty, 0),
    totalValue: byProduct.reduce((a, b) => a + b.value, 0),
    counts: {
      pidieron: active.length,
      borrador: rows.filter((r) => r.order?.status === "borrador").length,
      noPiden: rows.filter((r) => r.order?.status === "no_pide").length,
      sinRespuesta: rows.filter((r) => !r.order || r.order.status === "cancelado").length,
      total: rows.length,
    },
  };
}

export function inventory(s: State) {
  return s.products.map((p) => {
    const batches = s.production.filter((b) => b.productId === p.id);
    const produced = batches.reduce((a, b) => a + b.unitsProduced, 0);
    const waste = batches.reduce((a, b) => a + b.unitsWaste, 0);
    const sold = s.orders
      .filter((o) => o.status === "entregado")
      .flatMap((o) => o.items)
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qty, 0);
    const stock = produced - waste - sold;
    return { product: p, produced, waste, sold, stock, low: stock <= p.lowStockThreshold };
  });
}

/** Ingresos: automáticos (pedidos entregados y pagados) + manuales. */
export function allIncomes(s: State): Income[] {
  const auto: Income[] = s.orders
    .filter((o) => o.status === "entregado" && o.paid)
    .map((o) => {
      const wk = s.weeks.find((w) => w.id === o.weekId);
      const c = s.profiles.find((p) => p.id === o.customerId);
      return {
        id: `inc-${o.id}`,
        orderId: o.id,
        receivedOn: wk?.deliveryOn ?? o.updatedAt,
        concept: `Pedido · ${c?.businessName ?? c?.fullName ?? "Cliente"}`,
        amount: orderTotal(o),
        paymentMethod: o.paymentMethod ?? "efectivo",
      };
    });
  return [...auto, ...s.manualIncomes].sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
}

export const rootCategoryOf = (s: State, categoryId: string) => {
  const c = s.categories.find((x) => x.id === categoryId);
  if (!c) return undefined;
  return c.parentId ? s.categories.find((x) => x.id === c.parentId) : c;
};

const inRange = (d: string, from: string, to: string) => d >= from && d <= to;

export function finance(s: State, from: string, to: string) {
  const incomes = allIncomes(s).filter((i) => inRange(i.receivedOn, from, to));
  const expenses = s.expenses.filter((e) => inRange(e.spentOn, from, to));
  const income = incomes.reduce((a, i) => a + i.amount, 0);
  const expense = expenses.reduce((a, e) => a + e.amount, 0);
  const net = income - expense;
  const roots = s.categories.filter((c) => !c.parentId);
  const byCategory = roots
    .map((r) => ({
      category: r,
      amount: expenses.filter((e) => rootCategoryOf(s, e.categoryId)?.id === r.id).reduce((a, e) => a + e.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  return { incomes, expenses, income, expense, net, margin: income > 0 ? (net / income) * 100 : 0, byCategory };
}

export function weeklySeries(s: State) {
  return s.weeks.map((w) => {
    const end = s.weeks.find((x) => x.startsOn > w.startsOn)?.startsOn;
    const f = finance(s, w.startsOn, end ? addDays(end, -1) : "9999-12-31");
    return { week: w, income: f.income, expense: f.expense, net: f.net };
  });
}

export function investorSplit(net: number, percentage: number) {
  const distributable = Math.max(net, 0);
  const investor = Math.round((distributable * percentage) / 100);
  return { investor, owner: distributable - investor, loss: net < 0 ? net : 0 };
}

export function receivables(s: State) {
  return s.orders
    .filter((o) => o.status === "entregado" && !o.paid)
    .map((o) => ({ order: o, customer: s.profiles.find((p) => p.id === o.customerId)!, amount: orderTotal(o) }));
}
