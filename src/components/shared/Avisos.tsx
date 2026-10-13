import Link from "next/link";
import { BellOff } from "lucide-react";
import { Empty } from "@/components/ui/ui";
import { myNotifications } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { MarkRead } from "./MarkRead";

const when = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** Bandeja de avisos (se marcan como leídos al abrirla). */
export async function Avisos({ me }: { me: Profile }) {
  const items = await myNotifications(me.id);
  const unread = items.some((n) => !n.readAt);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-black">Avisos</h1>
      {unread && <MarkRead />}
      {items.length === 0 ? (
        <Empty icon={<BellOff className="size-8" aria-hidden />} title="No tienes avisos">
          Aquí verás los cambios de tus pedidos y los recordatorios.
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{n.title}</p>
                  {!n.readAt && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-oro" aria-label="Nuevo" />}
                </div>
                <p className="mt-0.5 whitespace-pre-line text-sm text-tinta-2">{n.body}</p>
                <p className="mt-1 text-xs text-tinta-2">{when.format(new Date(n.createdAt))}</p>
              </>
            );
            const cls = "block rounded-[var(--radius-card)] border p-4 " + (n.readAt ? "border-linea bg-card" : "border-oro/30 bg-oro/10");
            return (
              <li key={n.id}>
                {n.url ? (
                  <Link href={n.url} className={cls + " hover:brightness-95"}>
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
