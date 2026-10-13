"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  Ellipsis,
  Flame,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Logo, Wordmark } from "@/components/brand/Brand";
import { Sheet } from "@/components/ui/ui";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/admin/produccion", label: "Producción", icon: Flame },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/programacion", label: "Programación", icon: CalendarDays },
  { href: "/admin/inversionistas", label: "Inversionistas", icon: HandCoins },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
] as const;
const MOBILE_MAIN = ["/admin", "/admin/pedidos", "/admin/clientes", "/admin/finanzas"];

export function AdminShell({ bell, children }: { bell: ReactNode; children: ReactNode }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="tema-oscuro min-h-dvh bg-fondo text-tinta">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-oro focus:px-4 focus:py-2 focus:text-noche">
        Saltar al contenido
      </a>
      {/* Barra lateral (computador) */}
      <aside className="rombos-oscuro fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-linea bg-noche lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
          <Logo size={44} />
          <Wordmark dark />
        </Link>
        <div className="trenza trenza-oro mx-5 h-2 rounded-full opacity-70" aria-hidden />
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Panel">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={clsx(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                isActive(n.href) ? "bg-oro text-noche" : "text-tinta-2 hover:bg-card hover:text-tinta",
              )}
            >
              <n.icon className="size-[1.15rem]" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="border-t border-linea p-3">
          <button className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-tinta-2 hover:bg-card hover:text-tinta">
            <LogOut className="size-[1.15rem]" aria-hidden /> Cerrar sesión
          </button>
        </form>
      </aside>

      {/* Barra superior */}
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-linea bg-noche/90 px-4 py-2 backdrop-blur-md lg:ml-64 lg:justify-end lg:px-8">
        <Link href="/admin" className="flex items-center gap-2.5 lg:hidden">
          <Logo size={36} />
          <Wordmark dark />
        </Link>
        {bell}
      </header>

      <div className="lg:pl-64">
        <main id="contenido" className="mx-auto max-w-6xl px-4 pb-32 pt-5 lg:px-8 lg:pb-12 lg:pt-6">
          {children}
        </main>
      </div>

      {/* Navegación inferior (celular) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-noche/95 px-2 pt-2 backdrop-blur-md lg:hidden" aria-label="Panel">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.href)).map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={clsx("flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold", isActive(n.href) ? "text-oro" : "text-tinta-2")}
              >
                <span className={clsx("grid h-8 w-12 place-items-center rounded-full", isActive(n.href) && "bg-oro/15")}>
                  <n.icon className="size-5" aria-hidden />
                </span>
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              className={clsx(
                "flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-semibold",
                NAV.some((n) => !MOBILE_MAIN.includes(n.href) && isActive(n.href)) ? "text-oro" : "text-tinta-2",
              )}
            >
              <span className="grid h-8 w-12 place-items-center rounded-full">
                <Ellipsis className="size-5" aria-hidden />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Más opciones">
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {NAV.filter((n) => !MOBILE_MAIN.includes(n.href)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMore(false)}
              className={clsx("flex min-h-14 items-center gap-3 rounded-2xl border border-linea p-4 text-sm font-semibold", isActive(n.href) ? "bg-oro text-noche" : "bg-card")}
            >
              <n.icon className="size-5" aria-hidden />
              {n.label}
            </Link>
          ))}
          <form action={signOut} className="col-span-2">
            <button className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-linea p-4 text-sm font-semibold text-tinta-2">
              <LogOut className="size-5" aria-hidden /> Cerrar sesión
            </button>
          </form>
        </div>
      </Sheet>
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-black leading-tight lg:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-tinta-2">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
