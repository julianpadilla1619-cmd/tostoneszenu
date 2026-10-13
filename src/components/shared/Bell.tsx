import Link from "next/link";
import { Bell as BellIcon } from "lucide-react";
import { unreadCount } from "@/lib/data";

/** Campana con número de avisos sin leer. Lee la sesión: va dentro de <Suspense>. */
export async function Bell({ profileId, href }: { profileId: string; href: string }) {
  const n = await unreadCount(profileId);
  return <BellLink href={href} count={n} />;
}

export function BellLink({ href, count = 0 }: { href: string; count?: number }) {
  return (
    <Link
      href={href}
      className="relative grid size-11 shrink-0 place-items-center rounded-full bg-card-2 text-tinta transition hover:brightness-95"
      aria-label={count ? `Avisos, ${count} sin leer` : "Avisos"}
    >
      <BellIcon className="size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-mal px-1 text-[0.7rem] font-bold text-white ring-2 ring-fondo">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
