"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, ShoppingBasket, UserRound } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { href: "/app", label: "Inicio", icon: House },
  { href: "/app/pedido", label: "Pedir", icon: ShoppingBasket },
  { href: "/app/historial", label: "Historial", icon: History },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
] as const;

/** Marco móvil del cliente: encabezado (slot) + navegación inferior fija. */
export function ClienteShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="tema-claro rombos min-h-dvh bg-fondo text-tinta">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-fondo/95 shadow-[0_0_60px_-20px_rgba(107,66,32,.35)]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-linea bg-fondo/90 px-4 py-2 backdrop-blur-md">
          {header}
        </header>
        <main id="contenido" className="flex-1 px-4 pb-32 pt-4">
          {children}
        </main>
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-linea bg-fondo/95 px-3 pt-2 backdrop-blur-md" aria-label="Navegación principal">
          <ul className="grid grid-cols-4">
            {nav.map((n) => {
              const active = n.href === "/app" ? path === "/app" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition", active ? "text-noche" : "text-tinta-2")}
                  >
                    <span className={clsx("grid h-8 w-14 place-items-center rounded-full transition", active && "bg-oro")}>
                      <n.icon className="size-5" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                    </span>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
