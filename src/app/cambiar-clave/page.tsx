"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { updatePassword } from "@/app/actions/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Logo } from "@/components/brand/Brand";
import { Field, FormError, SubmitButton } from "@/components/ui/ui";

export default function CambiarClave() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <main className="tema-oscuro grano relative flex min-h-dvh items-center bg-noche text-cana">
      <div className="rombos-oscuro absolute inset-0" />
      <div className="relative mx-auto w-full max-w-md px-5 py-10">
        <div className="flex flex-col items-center text-center">
          <Logo size={88} priority />
          <h1 className="mt-4 font-display text-3xl font-black">Nueva contraseña</h1>
          <p className="mt-1 text-cana/75">Mínimo 8 caracteres. Que sea fácil de recordar para ti y difícil de adivinar.</p>
        </div>
        <form action={action} className="mt-8 flex flex-col gap-4">
          <Field label="Contraseña nueva">{(id) => <PasswordInput id={id} name="password" autoComplete="new-password" minLength={8} required />}</Field>
          <Field label="Repítela">{(id) => <PasswordInput id={id} name="confirm" autoComplete="new-password" minLength={8} required />}</Field>
          <FormError message={state?.error} />
          <SubmitButton size="lg" icon={<KeyRound className="size-5" aria-hidden />}>
            Guardar contraseña
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
