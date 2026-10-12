"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChartPie, LockKeyhole, ShieldCheck, Store, UserRound } from "lucide-react";
import { Logo, Rombo } from "@/components/brand/Brand";
import { homeFor } from "@/components/RoleGate";
import { Button, Field, Input } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

const demos = [
  { id: "c1", label: "Mayorista", who: "Tienda La Esquina", icon: Store },
  { id: "c6", label: "Cliente regular", who: "Kiosko El Parque", icon: UserRound },
  { id: "u-admin", label: "Administrador", who: "Panel completo", icon: ShieldCheck },
  { id: "u-inv", label: "Inversionista", who: "Solo lectura", icon: ChartPie },
];

export function LoginForm() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function enter(userId: string) {
    const p = state.profiles.find((x) => x.id === userId);
    if (!p) return;
    if (p.status !== "activo") {
      setError("Tu cuenta todavía está pendiente de aprobación. Te avisamos por WhatsApp.");
      return;
    }
    dispatch({ type: "login", userId });
    router.push(homeFor(p.role));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const phone = String(new FormData(e.currentTarget).get("phone") ?? "").replace(/\D/g, "");
    const p = state.profiles.find((x) => x.phone === phone);
    if (!p) return setError("No encontramos ese celular. ¿Ya enviaste tu solicitud?");
    enter(p.id);
  }

  return (
    <main className="tema-oscuro grano relative flex min-h-dvh flex-col bg-noche text-cana">
      <div className="rombos-oscuro absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-4">
        <Link href="/" className="inline-flex h-10 w-fit items-center gap-1.5 text-sm text-cana/60 hover:text-oro">
          <ArrowLeft className="size-4" /> Inicio
        </Link>

        <div className="animate-subir mt-4 flex flex-col items-center text-center">
          <Logo size={128} priority className="drop-shadow-[0_20px_30px_rgba(0,0,0,.5)]" />
          <h1 className="mt-5 font-display text-4xl font-black">¡Qué hubo!</h1>
          <p className="mt-1 text-cana/65">Entra para hacer tu pedido de la semana.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Celular">{(id) => <Input id={id} name="phone" inputMode="tel" autoComplete="tel-national" placeholder="310 456 7890" required />}</Field>
          <Field label="Contraseña">
            {(id) => <Input id={id} name="password" type="password" autoComplete="current-password" placeholder="••••••" />}
          </Field>
          {error && (
            <p role="alert" className="rounded-xl bg-mal/15 px-3 py-2 text-sm text-mal">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" icon={<LockKeyhole className="size-5" />}>
            Entrar
          </Button>
          <p className="text-center text-xs text-cana/45">Tu sesión queda abierta en este celular. No tienes que volver a entrar.</p>
        </form>

        <div className="mt-10">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-oro/80">
            <Rombo className="size-3" /> Cuentas de prueba <Rombo className="size-3" />
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {demos.map((d) => (
              <button
                key={d.id}
                onClick={() => enter(d.id)}
                className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-linea bg-card p-3.5 text-left transition hover:border-oro/50 active:scale-[.97]"
              >
                <d.icon className="size-5 text-oro" />
                <span className="text-sm font-bold">{d.label}</span>
                <span className="-mt-1.5 text-xs text-tinta-2">{d.who}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-auto pt-10 text-center text-sm text-cana/55">
          ¿No tienes cuenta?{" "}
          <Link href="/#solicitud" className="font-semibold text-oro underline-offset-4 hover:underline">
            Solicítala aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
