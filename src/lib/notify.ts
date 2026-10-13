import "server-only";
import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";

export interface Message {
  title: string;
  body: string;
  /** Ruta dentro de la app a la que lleva el aviso (ej. "/app"). */
  url?: string;
}

type Target = { profileIds?: string[]; admins?: boolean };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

let vapidReady: boolean | null = null;
function vapid() {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  vapidReady = !!(pub && priv);
  if (vapidReady) webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@tostoneszenu.com", pub!, priv!);
  return vapidReady;
}

/**
 * Envía un aviso por los tres canales:
 * 1. Bandeja dentro de la app (tabla notifications) — siempre.
 * 2. Push al celular — si la persona lo activó y hay llaves VAPID.
 * 3. Correo — si tiene correo, lo activó y hay RESEND_API_KEY.
 * Nunca lanza: un fallo de envío no debe romper la acción que lo disparó.
 */
export async function notify(target: Target, msg: Message) {
  try {
    const db = createAdminClient();
    let q = db.from("profiles").select("id, email, notify_email, notify_push").eq("status", "activo");
    if (target.admins && target.profileIds?.length) q = q.or(`role.eq.admin,id.in.(${target.profileIds.join(",")})`);
    else if (target.admins) q = q.eq("role", "admin");
    else if (target.profileIds?.length) q = q.in("id", target.profileIds);
    else return;
    const { data: people } = await q;
    if (!people?.length) return;

    await db.from("notifications").insert(people.map((p) => ({ profile_id: p.id, title: msg.title, body: msg.body, url: msg.url ?? null })));

    await Promise.allSettled([
      sendPush(
        people.filter((p) => p.notify_push).map((p) => p.id),
        msg,
      ),
      ...people.filter((p) => p.notify_email && p.email).map((p) => sendEmail(p.email!, msg)),
    ]);
  } catch (err) {
    console.error("[notify]", err);
  }
}

async function sendPush(profileIds: string[], msg: Message) {
  if (!profileIds.length || !vapid()) return;
  const db = createAdminClient();
  const { data: subs } = await db.from("push_subscriptions").select("id, subscription").in("profile_id", profileIds);
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: msg.url ?? "/" });
  await Promise.allSettled(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, payload, { TTL: 60 * 60 * 24 });
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        // Suscripción vencida o desinstalada: se limpia.
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
        else console.error("[push]", code, err);
      }
    }),
  );
}

async function sendEmail(to: string, msg: Message) {
  const key = process.env.RESEND_API_KEY;
  if (!key || to.endsWith("@clientes.tostoneszenu.app")) return;
  const link = `${SITE}${msg.url ?? "/"}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4ead2;font-family:Arial,sans-serif;color:#15110c">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="100%" style="max-width:480px;background:#fffaee;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0">
  <tr><td style="background:#15110c;padding:18px 24px;color:#f0d58c;font-weight:bold;font-size:18px">Tostones Zenú <span style="color:#d9a93a;font-size:12px;letter-spacing:2px">SABOR TUCHINERO</span></td></tr>
  <tr><td style="padding:24px"><h1 style="margin:0 0 8px;font-size:20px">${escapeHtml(msg.title)}</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.5">${escapeHtml(msg.body)}</p>
  <a href="${link}" style="display:inline-block;background:#d9a93a;color:#15110c;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">Abrir la app</a></td></tr>
  <tr><td style="padding:0 24px 20px;font-size:12px;color:#6a5238">Recibes este correo porque tienes activados los avisos por correo en tu perfil.</td></tr>
  </table></td></tr></table></body></html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Tostones Zenú <onboarding@resend.dev>", to, subject: msg.title, html }),
  });
  if (!res.ok) console.error("[email]", res.status, await res.text());
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
