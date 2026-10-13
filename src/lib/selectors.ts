// Cálculos de negocio puros (sin acceso a datos). Se usan en servidor y cliente.
import { addDays } from "./format";
import type { Expense, ExpenseCategory, Income, Order, OrderStatus, Product } from "./types";

export const ACTIVE_STATUSES: OrderStatus[] = ["confirmado", "en_produccion", "en_camino", "entregado"];
export const isActive = (o: Pick<Order, "status">) => ACTIVE_STATUSES.includes(o.status);
/** Pedidos que todavía hay que producir/entregar (lo entregado ya salió del inventario). */
export const pendingDelivery = (orders: Order[]) => orders.filter((o) => isActive(o) && o.status !== "entregado");

export const orderTotal = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const orderPacks = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty, 0);

/** Totales por producto (y por día de entrega) de los pedidos activos. */
export function consolidate(orders: Order[], products: Product[]) {
  const active = orders.filter(isActive);
  const byProduct = products
    .map((p) => {
      const items = active.flatMap((o) => o.items).filter((i) => i.productId === p.id);
      return { product: p, qty: items.reduce((a, i) => a + i.qty, 0), value: items.reduce((a, i) => a + i.qty * i.unitPrice, 0) };
    })
    .filter((r) => r.qty > 0 || r.product.active);
  const days = [...new Set(active.map((o) => o.deliveryOn).filter(Boolean) as string[])].sort();
  const byDay = days.map((d) => {
    const ds = active.filter((o) => o.deliveryOn === d);
    return { date: d, orders: ds.length, packs: ds.reduce((a, o) => a + orderPacks(o), 0), value: ds.reduce((a, o) => a + orderTotal(o), 0) };
  });
  return {
    active,
    byProduct,
    byDay,
    totalPacks: byProduct.reduce((a, b) => a + b.qty, 0),
    totalValue: byProduct.reduce((a, b) => a + b.value, 0),
  };
}

export const rootCategoryOf = (cats: ExpenseCategory[], id: string) => {
  const c = cats.find((x) => x.id === id);
  if (!c) return undefined;
  return c.parentId ? cats.find((x) => x.id === c.parentId) : c;
};

const inRange = (d: string, from: string, to: string) => d >= from && d <= to;

export function finance(incomes: Income[], expenses: Expense[], cats: ExpenseCategory[], from: string, to: string) {
  const inc = incomes.filter((i) => inRange(i.receivedOn, from, to));
  const exp = expenses.filter((e) => inRange(e.spentOn, from, to));
  const income = inc.reduce((a, i) => a + i.amount, 0);
  const expense = exp.reduce((a, e) => a + e.amount, 0);
  const net = income - expense;
  const byCategory = cats
    .filter((c) => !c.parentId)
    .map((r) => ({ category: r, amount: exp.filter((e) => rootCategoryOf(cats, e.categoryId)?.id === r.id).reduce((a, e) => a + e.amount, 0) }))
    .sort((a, b) => b.amount - a.amount);
  return { incomes: inc, expenses: exp, income, expense, net, margin: income > 0 ? (net / income) * 100 : 0, byCategory };
}

/** Ingresos y egresos por semana (lunes a domingo) para las últimas `n` semanas hasta `lastMonday`. */
export function weeklySeries(incomes: Income[], expenses: Expense[], lastMonday: string, n = 6) {
  return Array.from({ length: n }, (_, k) => {
    const from = addDays(lastMonday, -7 * (n - 1 - k));
    const to = addDays(from, 6);
    const income = incomes.filter((i) => inRange(i.receivedOn, from, to)).reduce((a, i) => a + i.amount, 0);
    const expense = expenses.filter((e) => inRange(e.spentOn, from, to)).reduce((a, e) => a + e.amount, 0);
    return { from, income, expense, net: income - expense };
  });
}

export function investorSplit(net: number, percentage: number) {
  const distributable = Math.max(net, 0);
  const investor = Math.round((distributable * percentage) / 100);
  return { investor, owner: distributable - investor };
}
