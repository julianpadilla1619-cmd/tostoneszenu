"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, ShoppingBasket, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Brand";
import { RoleGate } from "@/components/RoleGate";
import { ROLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

const nav = [
  { href: "/app", label: "Inicio", icon: House },
  { href: "/app/pedido", label: "Pedido", icon: ShoppingBasket },
  { href: "/app/historial", label: "Historial", icon: History },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
] as const;

export function ClienteShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["mayorista", "regular"]}>
      <Inner>{children}</Inner>
    </RoleGate>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const { me } = useStore();
  const path = usePathname();
  return (
    <div className="tema-claro rombos min-h-dvh bg-fondo text-tinta">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-fondo/95 shadow-[0_0_60px_-20px_rgba(107,66,32,.35)] md:my-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-linea bg-fondo/90 px-4 py-2.5 backdrop-blur-md">
          <Link href="/app" className="flex items-center gap-2.5">
            <Logo size={38} />
            <div className="leading-tight">
              <p className="font-display text-[0.95rem] font-black">{me?.businessName ?? me?.fullName}</p>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-canela">{me && ROLE_LABEL[me.role]}</p>
            </div>
          </Link>
        </header>
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-linea bg-fondo/95 px-3 pt-2 backdrop-blur-md" aria-label="Navegación">
          <ul className="grid grid-cols-4">
            {nav.map((n) => {
              const active = n.href === "/app" ? path === "/app" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx("flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[0.7rem] font-semibold transition", active ? "text-noche" : "text-tinta-2")}
                  >
                    <span className={clsx("grid h-8 w-14 place-items-center rounded-full transition", active && "bg-oro")}>
                      <n.icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
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
