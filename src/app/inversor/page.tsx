"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { InvestorPanel } from "@/components/admin/InvestorPanel";
import { Logo, Wordmark } from "@/components/brand/Brand";
import { RoleGate } from "@/components/RoleGate";
import { useStore } from "@/lib/store";

export default function InversorPage() {
  return (
    <RoleGate roles={["inversionista"]}>
      <Inner />
    </RoleGate>
  );
}

function Inner() {
  const { state, me, dispatch } = useStore();
  const router = useRouter();
  const investor = state.investors.find((i) => i.profileId === me?.id);

  return (
    <div className="tema-oscuro rombos-oscuro min-h-dvh bg-fondo text-tinta">
      <header className="flex items-center justify-between border-b border-linea px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={38} />
          <Wordmark dark />
        </div>
        <button
          onClick={() => {
            dispatch({ type: "logout" });
            router.push("/login");
          }}
          className="grid size-10 cursor-pointer place-items-center rounded-full bg-card text-tinta-2"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-6">
        <p className="text-sm text-tinta-2">Hola, {me?.fullName.split(" ")[0]}</p>
        <h1 className="mb-5 font-display text-3xl font-black">Tus ganancias</h1>
        {investor ? <InvestorPanel investor={investor} readOnly /> : <p className="text-tinta-2">Tu cuenta aún no tiene un porcentaje asignado.</p>}
      </main>
    </div>
  );
}
