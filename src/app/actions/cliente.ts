"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { check, run } from "@/lib/action";
import { requireAction } from "@/lib/auth";
import { getCatalog } from "@/lib/data";
import { dayLong, money } from "@/lib/format";
import { notify } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isEditable, orderWindow } from "@/lib/time";
import { email, isUuid, text, ValidationError } from "@/lib/validate";

export interface OrderInput {
  deliveryOn: string;
  items: { productId: string; qty: number }[];
  note?: string;
}

/**
 * Crea o actualiza el pedido de la semana del cliente.
 * Valida en el servidor: hora límite, día de entrega, mínimo y precios vigentes.
 */
export async function saveMyOrder(input: OrderInput) {
  return run(async () => {
    const me = await requireAction(["mayorista"]);
    const { settings, products } = await getCatalog();
    const win = orderWindow(settings);
    if (!win.open.some((d) => d.date === input.deliveryOn)) throw new ValidationError("Ese día de entrega ya cerró. Elige otro.");

    const byId = new Map(products.map((p) => [p.id, p]));
    const items = input.items
      .filter((i) => isUuid(i.productId) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 10000)
      .map((i) => {
        const p = byId.get(i.productId);
        if (!p) throw new ValidationError("Uno de los productos ya no está disponible. Recarga la página.");
        return { product_id: p.id, qty: i.qty, unit_price: p.price };
      });
    const packs = items.reduce((a, i) => a + i.qty, 0);
    if (packs < settings.wholesaleMinPacks) throw new ValidationError(`El pedido mínimo es de ${settings.wholesaleMinPacks} paquetes.`);
    const note = input.note?.trim().slice(0, 300) || null;

    const db = createAdminClient();
    const { data: existing } = await db.from("orders").select("id, status, delivery_on").eq("customer_id", me.id).eq("week_start", win.weekStart).maybeSingle();
    if (existing && !["borrador", "confirmado", "no_pide", "cancelado"].includes(existing.status))
      throw new ValidationError("Tu pedido ya está en producción; ya no se puede cambiar. Escríbenos por WhatsApp.");
    if (existing?.delivery_on && !isEditable(existing.delivery_on, win.weekStart, settings))
      throw new ValidationError("Ya pasó la hora límite para cambiar este pedido.");

    const { data: order } = check(
      await db
        .from("orders")
        .upsert(
          { customer_id: me.id, week_start: win.weekStart, delivery_on: input.deliveryOn, status: "confirmado", paid: false, note, created_by: me.id },
          { onConflict: "customer_id,week_start" },
        )
        .select("id")
        .single(),
    );
    check(await db.from("order_items").delete().eq("order_id", order!.id));
    check(await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: order!.id }))));

    const total = items.reduce((a, i) => a + i.qty * i.unit_price, 0);
    const who = me.businessName ?? me.fullName;
    const changed = existing && existing.status === "confirmado";
    after(() =>
      notify(
        { admins: true },
        {
          title: changed ? `Pedido modificado · ${who}` : `Nuevo pedido · ${who}`,
          body: `${packs} paquetes por ${money(total)} para el ${dayLong(input.deliveryOn).toLowerCase()}.`,
          url: "/admin/pedidos",
        },
      ),
    );
    refresh();
    return { ok: true as const, message: "¡Listo! Tu pedido quedó montado." };
  });
}

/** "Esta semana no pido" o deshacerlo. */
export async function setMyWeekSkip(skip: boolean) {
  return run(async () => {
    const me = await requireAction(["mayorista"]);
    const { settings } = await getCatalog();
    const win = orderWindow(settings);
    if (!win.open.length) throw new ValidationError("Ya cerraron los pedidos de esta semana.");
    const db = createAdminClient();
    const { data: existing } = await db.from("orders").select("id, status, delivery_on").eq("customer_id", me.id).eq("week_start", win.weekStart).maybeSingle();
    if (existing && !["borrador", "confirmado", "no_pide", "cancelado"].includes(existing.status))
      throw new ValidationError("Tu pedido ya está en producción.");
    if (existing?.delivery_on && !isEditable(existing.delivery_on, win.weekStart, settings)) throw new ValidationError("Ya pasó la hora límite.");

    if (existing) {
      check(await db.from("order_items").delete().eq("order_id", existing.id));
      check(await db.from("orders").update({ status: skip ? "no_pide" : "cancelado", delivery_on: null }).eq("id", existing.id));
    } else if (skip) {
      check(await db.from("orders").insert({ customer_id: me.id, week_start: win.weekStart, status: "no_pide", created_by: me.id }));
    }
    refresh();
    return { ok: true as const, message: skip ? "Listo. Esta semana no te mandamos nada." : "Listo, puedes hacer tu pedido." };
  });
}

/** Datos de contacto y preferencias de avisos del propio cliente. */
export async function updateMyPreferences(formData: FormData) {
  return run(async () => {
    const me = await requireAction(["mayorista", "admin", "inversionista"]);
    const db = await createClient();
    check(
      await db
        .from("profiles")
        .update({
          email: email(formData, "email"),
          address: me.role === "mayorista" ? text(formData, "address", { max: 160 }) : me.address,
          notify_email: formData.get("notify_email") === "on",
          notify_push: formData.get("notify_push") === "on",
        })
        .eq("id", me.id),
    );
    refresh();
    return { ok: true as const, message: "Guardado" };
  });
}

/** Guarda la suscripción push de este celular/navegador. */
export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  return run(async () => {
    const me = await requireAction(["mayorista", "admin", "inversionista"]);
    if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) throw new ValidationError("Suscripción no válida.");
    // Service role: el mismo celular puede haber estado suscrito con otra cuenta.
    const db = createAdminClient();
    check(
      await db
        .from("push_subscriptions")
        .upsert({ profile_id: me.id, endpoint: sub.endpoint, subscription: { endpoint: sub.endpoint, keys: sub.keys } }, { onConflict: "endpoint" }),
    );
    return { ok: true as const };
  });
}

export async function removePushSubscription(endpoint: string) {
  return run(async () => {
    const me = await requireAction(["mayorista", "admin", "inversionista"]);
    const db = await createClient();
    await db.from("push_subscriptions").delete().eq("profile_id", me.id).eq("endpoint", endpoint);
    return { ok: true as const };
  });
}

export async function markNotificationsRead() {
  return run(async () => {
    const me = await requireAction(["mayorista", "admin", "inversionista"]);
    const db = await createClient();
    await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", me.id).is("read_at", null);
    refresh();
    return { ok: true as const };
  });
}
