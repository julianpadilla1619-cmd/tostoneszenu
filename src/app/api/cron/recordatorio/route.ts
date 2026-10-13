import { NextResponse, type NextRequest } from "next/server";
import { addDays, dayLong } from "@/lib/format";
import { toSettings } from "@/lib/mappers";
import { notify } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { isoWeekday, mondayOf, todayBogota } from "@/lib/time";

/**
 * Vercel Cron (vercel.json) — todos los días a las 10:00 a. m. de Colombia.
 * Si mañana hay entrega, recuerda pedir a los clientes que aún no tienen pedido esa semana.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: s } = await db.from("settings").select("*").single();
  const settings = toSettings(s!);
  const tomorrow = addDays(todayBogota(), 1);
  if (!settings.deliveryWeekdays.includes(isoWeekday(tomorrow))) return NextResponse.json({ skipped: "Mañana no hay entrega" });

  const weekStart = mondayOf(tomorrow);
  const [{ data: customers }, { data: orders }] = await Promise.all([
    db.from("profiles").select("id").eq("role", "mayorista").eq("status", "activo"),
    db.from("orders").select("customer_id").eq("week_start", weekStart).neq("status", "cancelado"),
  ]);
  const answered = new Set((orders ?? []).map((o) => o.customer_id));
  const pending = (customers ?? []).map((c) => c.id).filter((id) => !answered.has(id));
  if (pending.length) {
    await notify(
      { profileIds: pending },
      {
        title: "¿Cuántos paquetes te mandamos?",
        body: `Mañana, ${dayLong(tomorrow).toLowerCase()}, hay entrega. Tienes hasta hoy a las ${settings.cutoffTime} para montar tu pedido.`,
        url: "/app/pedido",
      },
    );
  }
  return NextResponse.json({ reminded: pending.length });
}
