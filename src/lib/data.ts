import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import * as m from "./mappers";
import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";
import type { Faq, Product, Settings } from "./types";

export const CATALOG_TAG = "catalogo";

const FALLBACK_SETTINGS: Settings = {
  deliveryWeekdays: [2, 4],
  cutoffTime: "18:00",
  wholesaleMinPacks: 10,
  reminderWeekday: 4,
  reminderTime: "10:00",
  whatsapp: null,
  headline: "El sabor original del Zenú.",
  zones: "Tuchín y municipios cercanos de Córdoba y Sucre.",
  contactEmail: null,
};

/**
 * Catálogo público (ajustes, productos activos, preguntas frecuentes).
 * Cacheado; las acciones del admin lo invalidan con updateTag(CATALOG_TAG).
 */
export async function getCatalog(): Promise<{ settings: Settings; products: Product[]; faqs: Faq[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  const db = createPublicClient();
  const [s, p, f] = await Promise.all([
    db.from("settings").select("*").maybeSingle(),
    db.from("products").select("*").eq("active", true).order("sort"),
    db.from("faqs").select("*").eq("active", true).order("sort"),
  ]);
  const err = s.error ?? p.error ?? f.error;
  if (err) {
    console.error("[catalogo] No se pudo leer de Supabase:", err.message);
    cacheLife("minutes"); // reintentar pronto en vez de guardar un catálogo vacío por horas
  } else cacheLife("hours");
  return {
    settings: s.data ? m.toSettings(s.data) : FALLBACK_SETTINGS,
    products: (p.data ?? []).map(m.toProduct),
    faqs: (f.data ?? []).map(m.toFaq),
  };
}

// ---------- Lecturas con la sesión del usuario (RLS) ----------

const ORDER_SELECT = "*, order_items(product_id, qty, unit_price)";

export async function myOrders(profileId: string) {
  const db = await createClient();
  const { data } = await db.from("orders").select(ORDER_SELECT).eq("customer_id", profileId).order("week_start", { ascending: false }).limit(30);
  return (data ?? []).map(m.toOrder);
}

export async function myNotifications(profileId: string, limit = 40) {
  const db = await createClient();
  const { data } = await db.from("notifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map(m.toNotification);
}

export async function unreadCount(profileId: string) {
  const db = await createClient();
  const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("profile_id", profileId).is("read_at", null);
  return count ?? 0;
}

// ---------- Lecturas de administración (RLS: admin_all) ----------

export async function adminProducts() {
  const db = await createClient();
  const { data } = await db.from("products").select("*").order("sort");
  return (data ?? []).map(m.toProduct);
}

export async function adminFaqs() {
  const db = await createClient();
  const { data } = await db.from("faqs").select("*").order("sort");
  return (data ?? []).map(m.toFaq);
}

export async function adminSettings() {
  const db = await createClient();
  const { data } = await db.from("settings").select("*").maybeSingle();
  return data ? m.toSettings(data) : FALLBACK_SETTINGS;
}

export async function ordersBetween(fromWeek: string, toWeek: string) {
  const db = await createClient();
  const { data } = await db.from("orders").select(ORDER_SELECT).gte("week_start", fromWeek).lte("week_start", toWeek);
  return (data ?? []).map(m.toOrder);
}

export async function deliveredOrders() {
  const db = await createClient();
  const { data } = await db.from("orders").select(ORDER_SELECT).eq("status", "entregado");
  return (data ?? []).map(m.toOrder);
}

export async function profilesByRole(roles: string[]) {
  const db = await createClient();
  const { data } = await db.from("profiles").select("*").in("role", roles).order("business_name", { nullsFirst: false });
  return (data ?? []).map(m.toProfile);
}

export async function signupRequests(status: "nueva" | "todas" = "nueva") {
  const db = await createClient();
  let q = db.from("signup_requests").select("*").order("created_at", { ascending: false });
  if (status === "nueva") q = q.eq("status", "nueva");
  const { data } = await q;
  return (data ?? []).map(m.toRequest);
}

export async function productionBatches(limit = 60) {
  const db = await createClient();
  const { data } = await db.from("production_batches").select("*").order("produced_on", { ascending: false }).limit(limit);
  return (data ?? []).map(m.toBatch);
}

export async function inventoryView() {
  const db = await createClient();
  const { data } = await db.from("v_inventory").select("*");
  return (data ?? []) as { product_id: string; produced: number; waste: number; sold: number; adjustments: number }[];
}

export async function expenseCategories() {
  const db = await createClient();
  const { data } = await db.from("expense_categories").select("*").order("name");
  return (data ?? []).map(m.toCategory);
}

export async function expensesBetween(from: string, to: string) {
  const db = await createClient();
  const { data } = await db.from("expenses").select("*").gte("spent_on", from).lte("spent_on", to).order("spent_on", { ascending: false });
  return (data ?? []).map(m.toExpense);
}

export async function incomesBetween(from: string, to: string) {
  const db = await createClient();
  const { data } = await db.from("incomes").select("*").gte("received_on", from).lte("received_on", to).order("received_on", { ascending: false });
  return (data ?? []).map(m.toIncome);
}

export async function investorsWithPayouts() {
  const db = await createClient();
  const [i, p] = await Promise.all([db.from("investors").select("*").order("created_at"), db.from("investor_payouts").select("*").order("period_end", { ascending: false })]);
  return { investors: (i.data ?? []).map(m.toInvestor), payouts: (p.data ?? []).map(m.toPayout) };
}

export async function tasksBetween(from: string, to: string) {
  const db = await createClient();
  const { data } = await db.from("schedule_tasks").select("*").gte("day", from).lte("day", to).order("day");
  return (data ?? []).map(m.toTask);
}

/** Totales del periodo para el inversionista (RPC que solo devuelve cifras agregadas). */
export async function financeSummary(from: string, to: string) {
  const db = await createClient();
  const { data } = await db.rpc("finance_summary", { p_from: from, p_to: to });
  const row = (data as { income: number; expense: number; net: number }[] | null)?.[0];
  return row ?? { income: 0, expense: 0, net: 0 };
}
