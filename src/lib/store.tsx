"use client";

// Estado del prototipo (datos de prueba). Expone la misma forma de acciones que
// tendrán las Server Actions con Supabase, para que las pantallas no cambien.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import * as seed from "./mock-data";
import { DEMO_TODAY } from "./mock-data";
import type {
  Expense,
  ExpenseCategory,
  Income,
  Investor,
  InvestorPayout,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductionBatch,
  Profile,
  Role,
  ScheduleTask,
  Settings,
  SignupRequest,
  Week,
} from "./types";

export interface State {
  /** true cuando ya se leyó el almacenamiento local (no se persiste). */
  hydrated?: boolean;
  sessionUserId: string | null;
  settings: Settings;
  products: Product[];
  profiles: Profile[];
  weeks: Week[];
  orders: Order[];
  production: ProductionBatch[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  manualIncomes: Income[];
  investors: Investor[];
  payouts: InvestorPayout[];
  requests: SignupRequest[];
  tasks: ScheduleTask[];
}

const initialState: State = {
  sessionUserId: null,
  settings: seed.settings,
  products: seed.products,
  profiles: seed.profiles,
  weeks: seed.weeks,
  orders: seed.orders,
  production: seed.production,
  categories: seed.categories,
  expenses: seed.expenses,
  manualIncomes: seed.manualIncomes,
  investors: seed.investors,
  payouts: seed.payouts,
  requests: seed.requests,
  tasks: seed.tasks,
};

type Action =
  | { type: "hydrate"; state: State | null }
  | { type: "reset" }
  | { type: "login"; userId: string }
  | { type: "logout" }
  | { type: "upsertOrder"; order: Order }
  | { type: "setOrderStatus"; orderId: string; status: OrderStatus }
  | { type: "setOrderPaid"; orderId: string; paid: boolean; method?: PaymentMethod }
  | { type: "addBatch"; batch: ProductionBatch }
  | { type: "removeBatch"; id: string }
  | { type: "addExpense"; expense: Expense }
  | { type: "removeExpense"; id: string }
  | { type: "addIncome"; income: Income }
  | { type: "removeIncome"; id: string }
  | { type: "addCategory"; category: ExpenseCategory }
  | { type: "updateInvestor"; investor: Investor }
  | { type: "addPayout"; payout: InvestorPayout }
  | { type: "addRequest"; request: SignupRequest }
  | { type: "resolveRequest"; id: string; approve: boolean }
  | { type: "updateProfile"; profile: Profile }
  | { type: "removeProfile"; id: string }
  | { type: "toggleTask"; id: string }
  | { type: "addTask"; task: ScheduleTask }
  | { type: "updateProduct"; product: Product }
  | { type: "updateSettings"; settings: Settings };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...(a.state ?? s), hydrated: true };
    case "reset":
      return { ...initialState, sessionUserId: s.sessionUserId, hydrated: true };
    case "login":
      return { ...s, sessionUserId: a.userId };
    case "logout":
      return { ...s, sessionUserId: null };
    case "upsertOrder": {
      const exists = s.orders.some((o) => o.id === a.order.id);
      return { ...s, orders: exists ? s.orders.map((o) => (o.id === a.order.id ? a.order : o)) : [...s.orders, a.order] };
    }
    case "setOrderStatus":
      return { ...s, orders: s.orders.map((o) => (o.id === a.orderId ? { ...o, status: a.status, updatedAt: DEMO_TODAY } : o)) };
    case "setOrderPaid":
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id === a.orderId ? { ...o, paid: a.paid, paymentMethod: a.paid ? a.method ?? o.paymentMethod ?? "efectivo" : undefined } : o,
        ),
      };
    case "addBatch":
      return { ...s, production: [...s.production, a.batch] };
    case "removeBatch":
      return { ...s, production: s.production.filter((b) => b.id !== a.id) };
    case "addExpense":
      return { ...s, expenses: [...s.expenses, a.expense] };
    case "removeExpense":
      return { ...s, expenses: s.expenses.filter((e) => e.id !== a.id) };
    case "addIncome":
      return { ...s, manualIncomes: [...s.manualIncomes, a.income] };
    case "removeIncome":
      return { ...s, manualIncomes: s.manualIncomes.filter((i) => i.id !== a.id) };
    case "addCategory":
      return { ...s, categories: [...s.categories, a.category] };
    case "updateInvestor":
      return { ...s, investors: s.investors.map((i) => (i.id === a.investor.id ? a.investor : i)) };
    case "addPayout":
      return { ...s, payouts: [...s.payouts, a.payout] };
    case "addRequest":
      return { ...s, requests: [a.request, ...s.requests] };
    case "resolveRequest": {
      const req = s.requests.find((r) => r.id === a.id);
      if (!req) return s;
      const requests = s.requests.map((r) => (r.id === a.id ? { ...r, status: a.approve ? ("aprobada" as const) : ("rechazada" as const) } : r));
      if (!a.approve) return { ...s, requests };
      const profile: Profile = {
        id: `u-${req.id}`,
        fullName: req.fullName,
        phone: req.phone,
        businessName: req.businessName,
        role: req.requestedRole,
        status: "activo",
        municipality: req.municipality,
        createdAt: DEMO_TODAY,
      };
      return { ...s, requests, profiles: [...s.profiles, profile] };
    }
    case "updateProfile":
      return { ...s, profiles: s.profiles.map((p) => (p.id === a.profile.id ? a.profile : p)) };
    case "removeProfile":
      return { ...s, profiles: s.profiles.filter((p) => p.id !== a.id), orders: s.orders.filter((o) => o.customerId !== a.id) };
    case "toggleTask":
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) };
    case "addTask":
      return { ...s, tasks: [...s.tasks, a.task] };
    case "updateProduct":
      return { ...s, products: s.products.map((p) => (p.id === a.product.id ? a.product : p)) };
    case "updateSettings":
      return { ...s, settings: a.settings };
  }
}

const STORAGE_KEY = "tz-demo-v1";

interface StoreValue {
  state: State;
  ready: boolean;
  me: Profile | null;
  dispatch: (a: Action) => void;
  /** Guarda el pedido de la semana del cliente con precios según su rol. */
  saveOrder: (customerId: string, weekId: string, qtys: Record<string, number>, note: string | undefined, status: OrderStatus) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

let idCounter = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(++idCounter).toString(36)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ready = state.hydrated === true;

  useEffect(() => {
    let saved: State | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = { ...initialState, ...JSON.parse(raw) };
    } catch {
      /* almacenamiento no disponible: se usan los datos semilla */
    }
    dispatch({ type: "hydrate", state: saved });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const { hydrated: _omit, ...persisted } = state;
      void _omit;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* ignorar */
    }
  }, [state, ready]);

  const saveOrder = useCallback<StoreValue["saveOrder"]>(
    (customerId, weekId, qtys, note, status) => {
      const customer = state.profiles.find((p) => p.id === customerId);
      if (!customer) return;
      const items: OrderItem[] = state.products
        .filter((p) => (qtys[p.id] ?? 0) > 0)
        .map((p) => ({ productId: p.id, qty: qtys[p.id]!, unitPrice: priceFor(p, customer.role) }));
      const existing = state.orders.find((o) => o.customerId === customerId && o.weekId === weekId);
      dispatch({
        type: "upsertOrder",
        order: {
          id: existing?.id ?? `o-${weekId}-${customerId}`,
          customerId,
          weekId,
          status,
          paid: false,
          items: status === "no_pide" || status === "cancelado" ? [] : items,
          note: note || undefined,
          updatedAt: DEMO_TODAY,
        },
      });
    },
    [state.orders, state.products, state.profiles],
  );

  const me = useMemo(() => state.profiles.find((p) => p.id === state.sessionUserId) ?? null, [state.profiles, state.sessionUserId]);

  const value = useMemo(() => ({ state, ready, me, dispatch, saveOrder }), [state, ready, me, saveOrder]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}

export function priceFor(p: Product, role: Role) {
  return role === "mayorista" ? p.priceWholesale : p.priceRegular;
}
