"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Logo } from "@/components/brand/Brand";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

/** Protección de rutas del prototipo. Con Supabase se mueve a proxy.ts + RLS. */
export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { me, ready } = useStore();
  const router = useRouter();
  const allowed = !!me && me.status === "activo" && roles.includes(me.role);

  useEffect(() => {
    if (ready && !allowed) router.replace("/login");
  }, [ready, allowed, router]);

  if (!ready || !allowed)
    return (
      <div className="grid min-h-dvh place-items-center bg-noche">
        <Logo size={96} className="animate-pulse" priority />
      </div>
    );
  return <>{children}</>;
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "inversionista" ? "/inversor" : "/app";
}
