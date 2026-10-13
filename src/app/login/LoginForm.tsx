"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { requestPasswordReset, signIn } from "@/app/actions/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Logo } from "@/components/brand/Brand";
import { Field, FormError, Input, SubmitButton } from "@/components/ui/ui";

export function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "recuperar">("entrar");
  const [state, action] = useActionState(signIn, undefined);
  const [reset, resetAction] = useActionState(requestPasswordReset, undefined);
  const linkError = params.get("error") === "enlace" ? "El enlace venció o ya se usó. Pide uno nuevo." : null;

  return (
    <main className="tema-oscuro grano relative flex min-h-dvh flex-col bg-noche text-cana">
      <div className="rombos-oscuro absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-4">
        <Link href="/" className="inline-flex h-11 w-fit items-center gap-1.5 text-sm text-cana/70 hover:text-oro">
          <ArrowLeft className="size-4" aria-hidden /> Inicio
        </Link>

        <div className="animate-subir mt-2 flex flex-col items-center text-center">
          <Logo size={120} priority className="drop-shadow-[0_20px_30px_rgba(0,0,0,.5)]" />
          <h1 className="mt-5 font-display text-4xl font-black">{mode === "entrar" ? "¡Qué hubo!" : "Recuperar acceso"}</h1>
          <p className="mt-1 text-cana/75">
            {mode === "entrar" ? "Entra para hacer y seguir tus pedidos." : "Te enviamos un enlace para crear una contraseña nueva."}
          </p>
        </div>

        {mode === "entrar" ? (
          <form action={action} className="mt-8 flex flex-col gap-4">
            <Field label="Celular o correo" hint="Clientes: el celular con el que te registraste.">
              {(id) => <Input id={id} name="identifier" defaultValue={state?.identifier} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="300 123 4567" required />}
            </Field>
            <Field label="Contraseña">{(id) => <PasswordInput id={id} name="password" autoComplete="current-password" required />}</Field>
            <FormError message={state?.error ?? linkError} />
            <SubmitButton size="lg" icon={<LockKeyhole className="size-5" aria-hidden />} pendingText="Entrando…">
              Entrar
            </SubmitButton>
            <p className="text-center text-xs text-cana/60">Tu sesión queda abierta en este celular hasta que salgas.</p>
            <button type="button" onClick={() => setMode("recuperar")} className="mx-auto min-h-11 cursor-pointer text-sm font-semibold text-oro underline-offset-4 hover:underline">
              Olvidé mi contraseña
            </button>
          </form>
        ) : (
          <form action={resetAction} className="mt-8 flex flex-col gap-4">
            <Field label="Correo de tu cuenta">{(id) => <Input id={id} name="email" type="email" autoComplete="email" required />}</Field>
            <FormError message={reset?.error} />
            {reset?.message && (
              <p role="status" className="rounded-xl bg-oro/15 px-3 py-2 text-sm text-oro-claro">
                {reset.message}
              </p>
            )}
            <SubmitButton size="lg" icon={<Mail className="size-5" aria-hidden />} pendingText="Enviando…">
              Enviar enlace
            </SubmitButton>
            <p className="rounded-xl bg-card px-3 py-2.5 text-sm text-tinta-2">
              ¿Entras con tu celular? Escríbenos por WhatsApp y te damos una contraseña nueva.
            </p>
            <button type="button" onClick={() => setMode("entrar")} className="mx-auto min-h-11 cursor-pointer text-sm font-semibold text-oro">
              Volver a entrar
            </button>
          </form>
        )}

        <p className="mt-auto pt-10 text-center text-sm text-cana/70">
          ¿Todavía no eres cliente?{" "}
          <Link href="/#solicitud" className="font-semibold text-oro underline-offset-4 hover:underline">
            Envía tu solicitud
          </Link>
        </p>
      </div>
    </main>
  );
}
