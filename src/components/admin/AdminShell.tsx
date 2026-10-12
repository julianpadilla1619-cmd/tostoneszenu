"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Ellipsis,
  Flame,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Logo, Wordmark } from "@/components/brand/Brand";
import { RoleGate } from "@/components/RoleGate";
import { Sheet } from "@/components/ui/ui";
import { DEMO_TODAY } from "@/lib/mock-data";
import { dayLong } from "@/lib/format";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/programacion", label: "Programación", icon: CalendarDays },
  { href: "/admin/produccion", label: "Producción", icon: Flame },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/admin/inversionistas", label: "Inversionistas", icon: HandCoins },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
] as const;
const MOBILE_MAIN = ["/admin", "/admin/pedidos", "/admin/produccion", "/admin/finanzas"];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["admin"]}>
      <Inner>{children}</Inner>
    </RoleGate>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [more, setMore] = useState(false);
  const newRequests = state.requests.filter((r) => r.status === "nueva").length;
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const logout = () => {
    dispatch({ type: "logout" });
    router.push("/login");
  };

  return (
    <div className="tema-oscuro min-h-dvh bg-fondo text-tinta">
      {/* Barra lateral (escritorio) */}
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
              <n.icon className="size-[1.15rem]" />
              {n.label}
              {n.href === "/admin/usuarios" && newRequests > 0 && (
                <span className={clsx("ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[0.7rem]", isActive(n.href) ? "bg-noche text-oro" : "bg-oro text-noche")}>
                  {newRequests}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-linea p-3">
          <button onClick={logout} className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-tinta-2 hover:bg-card hover:text-tinta">
            <LogOut className="size-[1.15rem]" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-linea bg-noche/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo size={36} />
          <Wordmark dark />
        </Link>
        <span className="rounded-full bg-oro/15 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-oro">Admin</span>
      </header>

      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-tinta-2">{dayLong(DEMO_TODAY)}</p>
          {children}
        </div>
      </div>

      {/* Navegación inferior (móvil) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-noche/95 px-2 pt-2 backdrop-blur-md lg:hidden" aria-label="Panel">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.href)).map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={clsx("flex flex-col items-center gap-1 py-1 text-[0.68rem] font-semibold", isActive(n.href) ? "text-oro" : "text-tinta-2")}
              >
                <span className={clsx("grid h-8 w-12 place-items-center rounded-full", isActive(n.href) && "bg-oro/15")}>
                  <n.icon className="size-5" />
                </span>
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={() => setMore(true)}
              className={clsx(
                "relative flex w-full cursor-pointer flex-col items-center gap-1 py-1 text-[0.68rem] font-semibold",
                NAV.some((n) => !MOBILE_MAIN.includes(n.href) && isActive(n.href)) ? "text-oro" : "text-tinta-2",
              )}
            >
              <span className="grid h-8 w-12 place-items-center rounded-full">
                <Ellipsis className="size-5" />
              </span>
              Más
              {newRequests > 0 && <span className="absolute right-3 top-0.5 size-2 rounded-full bg-oro" />}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Más opciones">
        <div className="tema-oscuro grid grid-cols-2 gap-2.5 pb-4">
          {NAV.filter((n) => !MOBILE_MAIN.includes(n.href)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMore(false)}
              className={clsx("flex items-center gap-3 rounded-2xl border border-linea p-4 text-sm font-semibold", isActive(n.href) ? "bg-oro text-noche" : "bg-card")}
            >
              <n.icon className="size-5" />
              {n.label}
              {n.href === "/admin/usuarios" && newRequests > 0 && <span className="ml-auto rounded-full bg-oro px-1.5 text-xs text-noche">{newRequests}</span>}
            </Link>
          ))}
          <button onClick={logout} className="col-span-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-linea p-4 text-sm font-semibold text-tinta-2">
            <LogOut className="size-5" /> Cerrar sesión
          </button>
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
