"use server";

import { refresh, updateTag } from "next/cache";
import { after } from "next/server";
import { check, run } from "@/lib/action";
import { phoneToAuthEmail, requireAction } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data";
import { dayLong } from "@/lib/format";
import { notify } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentMethod } from "@/lib/types";
import { date, decimal, email, int, isUuid, oneOf, phone, tempPassword, text, ValidationError } from "@/lib/validate";

const admin = () => requireAction(["admin"]);
const METHODS = ["efectivo", "nequi", "daviplata", "transferencia", "otro"] as const;
const CATEGORIES = ["platano", "papa", "name", "yuca", "otro"] as const;
const STATUSES: OrderStatus[] = ["borrador", "confirmado", "no_pide", "cancelado", "en_produccion", "en_camino", "entregado"];

function catalogChanged() {
  updateTag(CATALOG_TAG);
  refresh();
}

// =============================================================
// Productos
// =============================================================
export async function saveProduct(formData: FormData) {
  return run(async () => {
    await admin();
    const id = formData.get("id");
    const row = {
      name: text(formData, "name", { required: true, max: 60, label: "el nombre" }),
      category: oneOf(formData, "category", CATEGORIES, "otro"),
      weight_grams: int(formData, "weight_grams", { required: true, min: 1, max: 10000, label: "el peso" }),
      description: text(formData, "description", { max: 240 }) ?? "",
      price: int(formData, "price", { required: true, min: 0, max: 1000000, label: "el precio" }),
      unit_cost: int(formData, "unit_cost", { min: 0, max: 1000000 }) ?? 0,
      low_stock_threshold: int(formData, "low_stock_threshold", { min: 0, max: 100000 }) ?? 0,
      sort: int(formData, "sort", { min: 0, max: 999 }) ?? 0,
      active: formData.get("active") === "on",
      featured: formData.get("featured") === "on",
    };
    const db = await createClient();
    if (isUuid(id)) check(await db.from("products").update(row).eq("id", id));
    else check(await db.from("products").insert(row));
    catalogChanged();
    return { ok: true as const, message: "Producto guardado" };
  });
}

export async function deleteProduct(id: string) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("Producto no válido.");
    const db = await createClient();
    const res = await db.from("products").delete().eq("id", id);
    if (res.error?.code === "23503") {
      // Ya tiene pedidos o producción: se oculta en lugar de borrarse para no perder historia.
      check(await db.from("products").update({ active: false, featured: false }).eq("id", id));
      catalogChanged();
      return { ok: true as const, message: "Tenía historial, así que lo ocultamos en lugar de borrarlo." };
    }
    check(res);
    catalogChanged();
    return { ok: true as const, message: "Producto eliminado" };
  });
}

// =============================================================
// Ajustes y preguntas frecuentes
// =============================================================
export async function saveSettings(formData: FormData) {
  return run(async () => {
    await admin();
    const days = formData
      .getAll("delivery_weekdays")
      .map(Number)
      .filter((d) => d >= 1 && d <= 7);
    if (!days.length) throw new ValidationError("Elige al menos un día de entrega.");
    const time = String(formData.get("cutoff_time") ?? "");
    const reminderTime = String(formData.get("reminder_time") ?? "");
    if (!/^\d{2}:\d{2}$/.test(time) || !/^\d{2}:\d{2}$/.test(reminderTime)) throw new ValidationError("Hora no válida.");
    const wa = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
    if (wa && !/^57\d{10}$/.test(wa)) throw new ValidationError("El WhatsApp debe quedar como 57 + 10 dígitos (ej. 573001234567).");
    const db = await createClient();
    check(
      await db
        .from("settings")
        .update({
          delivery_weekdays: [...new Set(days)].sort(),
          cutoff_days_before: int(formData, "cutoff_days_before", { required: true, min: 1, max: 7, label: "los días de anticipación" }),
          cutoff_time: time,
          wholesale_min_packs: int(formData, "wholesale_min_packs", { required: true, min: 1, max: 10000, label: "el mínimo" }),
          reminder_weekday: int(formData, "reminder_weekday", { required: true, min: 1, max: 7 }),
          reminder_time: reminderTime,
          whatsapp: wa || null,
          headline: text(formData, "headline", { required: true, max: 120, label: "el titular" }),
          zones: text(formData, "zones", { required: true, max: 240, label: "las zonas" }),
          contact_email: email(formData, "contact_email"),
        })
        .eq("id", true),
    );
    catalogChanged();
    return { ok: true as const, message: "Ajustes guardados" };
  });
}

/** Textos de la página principal. Un campo vacío vuelve al texto por defecto. */
export async function saveLandingTexts(formData: FormData) {
  return run(async () => {
    await admin();
    const t = (k: string, max: number) => text(formData, k, { max }) ?? "";
    const landing = {
      intro: t("intro", 400),
      productsTitle: t("productsTitle", 120),
      productsNote: t("productsNote", 240),
      steps: [0, 1, 2].map((i) => ({ title: t(`step${i}_title`, 80), text: t(`step${i}_text`, 240) })),
      weekTitle: t("weekTitle", 120),
      weekText: t("weekText", 400),
      signupTitle: t("signupTitle", 120),
      signupText: t("signupText", 240),
    };
    const db = await createClient();
    check(await db.from("settings").update({ landing }).eq("id", true));
    catalogChanged();
    return { ok: true as const, message: "Textos guardados" };
  });
}

export async function saveFaq(formData: FormData) {
  return run(async () => {
    await admin();
    const id = formData.get("id");
    const row = {
      question: text(formData, "question", { required: true, max: 160, label: "la pregunta" }),
      answer: text(formData, "answer", { required: true, max: 600, label: "la respuesta" }),
      sort: int(formData, "sort", { min: 0, max: 999 }) ?? 0,
      active: formData.get("active") === "on",
    };
    const db = await createClient();
    if (isUuid(id)) check(await db.from("faqs").update(row).eq("id", id));
    else check(await db.from("faqs").insert(row));
    catalogChanged();
    return { ok: true as const, message: "Pregunta guardada" };
  });
}

export async function deleteFaq(id: string) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("No válido.");
    const db = await createClient();
    check(await db.from("faqs").delete().eq("id", id));
    catalogChanged();
    return { ok: true as const };
  });
}

// =============================================================
// Clientes y solicitudes
// =============================================================

/**
 * Crea la cuenta de un cliente mayorista con una contraseña temporal.
 * Devuelve la contraseña para que el admin se la pase por WhatsApp (no se guarda en ningún lado).
 */
export async function createCustomer(formData: FormData) {
  return run(async () => {
    await admin();
    const cel = phone(formData);
    const fullName = text(formData, "full_name", { required: true, max: 80, label: "el nombre" })!;
    const businessName = text(formData, "business_name", { max: 80 });
    const municipality = text(formData, "municipality", { max: 60 });
    const address = text(formData, "address", { max: 160 });
    const contactEmail = email(formData, "email");
    const requestId = formData.get("request_id");
    const role = oneOf(formData, "role", ["mayorista", "inversionista"] as const, "mayorista");
    const password = tempPassword();

    const db = createAdminClient();
    const { data: dup } = await db.from("profiles").select("id").eq("phone", cel).maybeSingle();
    if (dup) throw new ValidationError("Ya existe una cuenta con ese celular.");

    const created = await db.auth.admin.createUser({
      email: role === "inversionista" && contactEmail ? contactEmail : phoneToAuthEmail(cel),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: cel, business_name: businessName, municipality },
    });
    if (created.error || !created.data.user) {
      if (created.error?.code === "email_exists") throw new ValidationError("Ya existe una cuenta con ese celular o correo.");
      console.error("[createCustomer]", created.error);
      throw new ValidationError("No se pudo crear la cuenta.");
    }
    // El trigger crea el perfil como pendiente; aquí se activa con los datos completos.
    check(
      await db
        .from("profiles")
        .update({ role, status: "activo", address, email: contactEmail, municipality, business_name: businessName })
        .eq("id", created.data.user.id),
    );
    if (isUuid(requestId)) await db.from("signup_requests").update({ status: "aprobada" }).eq("id", requestId);
    refresh();
    return { ok: true as const, data: { password, phone: cel, name: fullName, login: role === "inversionista" && contactEmail ? contactEmail : cel } };
  });
}

export async function updateCustomer(formData: FormData) {
  return run(async () => {
    await admin();
    const id = formData.get("id");
    if (!isUuid(id)) throw new ValidationError("Cliente no válido.");
    const cel = phone(formData);
    const db = createAdminClient();
    const { data: current } = await db.from("profiles").select("phone, role").eq("id", id).single();
    if (current?.role === "admin") throw new ValidationError("La cuenta de administrador se edita desde Supabase.");
    check(
      await db
        .from("profiles")
        .update({
          full_name: text(formData, "full_name", { required: true, max: 80, label: "el nombre" }),
          business_name: text(formData, "business_name", { max: 80 }),
          phone: cel,
          email: email(formData, "email"),
          municipality: text(formData, "municipality", { max: 60 }),
          address: text(formData, "address", { max: 160 }),
          notes: text(formData, "notes", { max: 300 }),
          status: oneOf(formData, "status", ["activo", "inactivo", "pendiente"] as const),
        })
        .eq("id", id),
    );
    // Si cambió el celular de un cliente, también cambia su usuario de entrada.
    if (current && current.phone !== cel && current.role === "mayorista") {
      const r = await db.auth.admin.updateUserById(id, { email: phoneToAuthEmail(cel!), email_confirm: true });
      if (r.error) throw new ValidationError("Se guardaron los datos, pero no se pudo cambiar el celular de entrada.");
    }
    refresh();
    return { ok: true as const, message: "Cliente actualizado" };
  });
}

export async function resetCustomerPassword(id: string) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("Cliente no válido.");
    const db = createAdminClient();
    const { data: p } = await db.from("profiles").select("role").eq("id", id).single();
    if (p?.role === "admin") throw new ValidationError("La contraseña del administrador se cambia desde “Olvidé mi contraseña”.");
    const password = tempPassword();
    const r = await db.auth.admin.updateUserById(id, { password });
    if (r.error) throw new ValidationError("No se pudo cambiar la contraseña.");
    return { ok: true as const, data: { password } };
  });
}

export async function deleteCustomer(id: string) {
  return run(async () => {
    const me = await admin();
    if (!isUuid(id) || id === me.id) throw new ValidationError("No puedes eliminar esta cuenta.");
    const db = createAdminClient();
    const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("status", "entregado");
    if (count) {
      // Con ventas registradas se desactiva para no borrar la contabilidad.
      check(await db.from("profiles").update({ status: "inactivo" }).eq("id", id));
      await db.auth.admin.updateUserById(id, { ban_duration: "876000h" });
      refresh();
      return { ok: true as const, message: "Tenía ventas registradas: la desactivamos en lugar de borrarla." };
    }
    const r = await db.auth.admin.deleteUser(id);
    if (r.error) throw new ValidationError("No se pudo eliminar la cuenta.");
    refresh();
    return { ok: true as const, message: "Cuenta eliminada" };
  });
}

export async function setRequestStatus(id: string, status: "rechazada" | "nueva") {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("No válido.");
    const db = await createClient();
    check(await db.from("signup_requests").update({ status }).eq("id", id));
    refresh();
    return { ok: true as const };
  });
}

// =============================================================
// Pedidos
// =============================================================
const STATUS_MSG: Partial<Record<OrderStatus, (d: string) => { title: string; body: string }>> = {
  en_produccion: () => ({ title: "Tu pedido está en producción", body: "Ya estamos fritando tus tajadas." }),
  en_camino: (d) => ({ title: "Tu pedido va en camino", body: `Lo estamos llevando ${d ? `hoy, ${dayLong(d).toLowerCase()}` : "hoy"}.` }),
  entregado: () => ({ title: "Pedido entregado", body: "¡Gracias por tu compra! Nos vemos en el próximo pedido." }),
};

export async function setOrdersStatus(ids: string[], status: OrderStatus) {
  return run(async () => {
    await admin();
    if (!STATUSES.includes(status) || !ids.length || !ids.every(isUuid)) throw new ValidationError("Datos no válidos.");
    const db = await createClient();
    const { data } = check(await db.from("orders").update({ status }).in("id", ids).select("customer_id, delivery_on"));
    const build = STATUS_MSG[status];
    if (build && data?.length) {
      after(() => Promise.all(data.map((o) => notify({ profileIds: [o.customer_id] }, { ...build(o.delivery_on ?? ""), url: "/app" }))));
    }
    refresh();
    return { ok: true as const, message: ids.length > 1 ? `${ids.length} pedidos actualizados` : "Pedido actualizado" };
  });
}

export async function setOrderPaid(id: string, paid: boolean, method?: PaymentMethod) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("Pedido no válido.");
    if (paid && method && !METHODS.includes(method)) throw new ValidationError("Método no válido.");
    const db = await createClient();
    check(await db.from("orders").update({ paid, payment_method: paid ? (method ?? "efectivo") : null }).eq("id", id));
    refresh();
    return { ok: true as const, message: paid ? "Pago registrado" : "Pago quitado" };
  });
}

/** Pedido creado o editado por el admin (ej. cliente que llamó). Sin restricción de hora límite. */
export async function adminSaveOrder(input: { customerId: string; weekStart: string; deliveryOn: string; items: { productId: string; qty: number }[]; note?: string }) {
  return run(async () => {
    const me = await admin();
    if (!isUuid(input.customerId) || !/^\d{4}-\d{2}-\d{2}$/.test(input.weekStart) || !/^\d{4}-\d{2}-\d{2}$/.test(input.deliveryOn))
      throw new ValidationError("Datos no válidos.");
    const db = await createClient();
    const { data: prods } = await db.from("products").select("id, price");
    const price = new Map((prods ?? []).map((p) => [p.id, p.price as number]));
    const items = input.items
      .filter((i) => i.qty > 0 && price.has(i.productId))
      .map((i) => ({ product_id: i.productId, qty: Math.min(10000, Math.floor(i.qty)), unit_price: price.get(i.productId)! }));
    if (!items.length) throw new ValidationError("Agrega al menos un producto.");
    const { data: order } = check(
      await db
        .from("orders")
        .upsert(
          { customer_id: input.customerId, week_start: input.weekStart, delivery_on: input.deliveryOn, status: "confirmado", note: input.note?.slice(0, 300) || null, created_by: me.id },
          { onConflict: "customer_id,week_start" },
        )
        .select("id")
        .single(),
    );
    check(await db.from("order_items").delete().eq("order_id", order!.id));
    check(await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: order!.id }))));
    after(() =>
      notify({ profileIds: [input.customerId] }, { title: "Te montamos un pedido", body: `Registramos tu pedido para el ${dayLong(input.deliveryOn).toLowerCase()}. Revísalo en la app.`, url: "/app" }),
    );
    refresh();
    return { ok: true as const, message: "Pedido guardado" };
  });
}

// =============================================================
// Producción, finanzas, inversionistas, programación
// =============================================================
export async function addBatch(formData: FormData) {
  return run(async () => {
    await admin();
    const productId = formData.get("product_id");
    if (!isUuid(productId)) throw new ValidationError("Elige un producto.");
    const db = await createClient();
    check(
      await db.from("production_batches").insert({
        product_id: productId,
        produced_on: date(formData, "produced_on"),
        units_produced: int(formData, "units_produced", { required: true, min: 1, max: 100000, label: "los paquetes producidos" }),
        units_waste: int(formData, "units_waste", { min: 0, max: 100000 }) ?? 0,
        notes: text(formData, "notes", { max: 200 }),
      }),
    );
    refresh();
    return { ok: true as const, message: "Lote registrado" };
  });
}

export async function deleteRow(table: "production_batches" | "expenses" | "incomes" | "schedule_tasks" | "investor_payouts", id: string) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("No válido.");
    const db = await createClient();
    // Los ingresos automáticos (de pedidos) solo los maneja el trigger.
    if (table === "incomes") check(await db.from("incomes").delete().eq("id", id).is("order_id", null));
    else check(await db.from(table).delete().eq("id", id));
    refresh();
    return { ok: true as const, message: "Eliminado" };
  });
}

export async function addExpense(formData: FormData) {
  return run(async () => {
    await admin();
    const db = await createClient();
    let categoryId = String(formData.get("category_id") ?? "");
    const newSub = text(formData, "new_subcategory", { max: 40 });
    const parent = formData.get("parent_id");
    if (categoryId === "__nueva") {
      if (!newSub || !isUuid(parent)) throw new ValidationError("Escribe el nombre de la subcategoría nueva.");
      const { data } = check(await db.from("expense_categories").insert({ name: newSub, parent_id: parent }).select("id").single());
      categoryId = data!.id;
    }
    if (!isUuid(categoryId)) throw new ValidationError("Elige una categoría.");
    check(
      await db.from("expenses").insert({
        spent_on: date(formData, "spent_on"),
        category_id: categoryId,
        description: text(formData, "description", { max: 160 }),
        quantity: decimal(formData, "quantity"),
        unit: text(formData, "unit", { max: 20 }),
        amount: int(formData, "amount", { required: true, min: 1, max: 100000000, label: "el monto" }),
        payment_method: oneOf(formData, "payment_method", METHODS, "efectivo"),
        supplier: text(formData, "supplier", { max: 80 }),
      }),
    );
    refresh();
    return { ok: true as const, message: "Gasto registrado" };
  });
}

export async function addIncome(formData: FormData) {
  return run(async () => {
    await admin();
    const db = await createClient();
    check(
      await db.from("incomes").insert({
        received_on: date(formData, "received_on"),
        concept: text(formData, "concept", { required: true, max: 120, label: "el concepto" }),
        amount: int(formData, "amount", { required: true, min: 1, max: 100000000, label: "el monto" }),
        payment_method: oneOf(formData, "payment_method", METHODS, "efectivo"),
      }),
    );
    refresh();
    return { ok: true as const, message: "Ingreso registrado" };
  });
}

export async function addCategory(formData: FormData) {
  return run(async () => {
    await admin();
    const parent = formData.get("parent_id");
    if (!isUuid(parent)) throw new ValidationError("Categoría no válida.");
    const db = await createClient();
    check(await db.from("expense_categories").insert({ name: text(formData, "name", { required: true, max: 40, label: "el nombre" }), parent_id: parent }));
    refresh();
    return { ok: true as const };
  });
}

export async function saveInvestor(formData: FormData) {
  return run(async () => {
    await admin();
    const id = formData.get("id");
    const profileId = formData.get("profile_id");
    const pct = decimal(formData, "percentage");
    if (pct === null || pct <= 0 || pct > 100) throw new ValidationError("El porcentaje debe estar entre 1 y 100.");
    const row = { name: text(formData, "name", { required: true, max: 80, label: "el nombre" }), percentage: pct, profile_id: isUuid(profileId) ? profileId : null };
    const db = await createClient();
    if (isUuid(id)) check(await db.from("investors").update(row).eq("id", id));
    else check(await db.from("investors").insert(row));
    refresh();
    return { ok: true as const, message: "Inversionista guardado" };
  });
}

export async function addPayout(input: { investorId: string; periodStart: string; periodEnd: string; amount: number }) {
  return run(async () => {
    await admin();
    if (!isUuid(input.investorId) || !(input.amount > 0)) throw new ValidationError("Datos no válidos.");
    const db = await createClient();
    check(
      await db.from("investor_payouts").insert({
        investor_id: input.investorId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        amount: Math.round(input.amount),
        paid_on: new Date().toISOString().slice(0, 10),
      }),
    );
    refresh();
    return { ok: true as const, message: "Pago registrado" };
  });
}

export async function addTask(formData: FormData) {
  return run(async () => {
    await admin();
    const db = await createClient();
    check(
      await db.from("schedule_tasks").insert({
        day: date(formData, "day"),
        kind: oneOf(formData, "kind", ["compra", "produccion", "empaque", "entrega", "pago", "otro"] as const, "otro"),
        title: text(formData, "title", { required: true, max: 120, label: "la tarea" }),
      }),
    );
    refresh();
    return { ok: true as const };
  });
}

export async function toggleTask(id: string, done: boolean) {
  return run(async () => {
    await admin();
    if (!isUuid(id)) throw new ValidationError("No válido.");
    const db = await createClient();
    check(await db.from("schedule_tasks").update({ done }).eq("id", id));
    refresh();
    return { ok: true as const };
  });
}
