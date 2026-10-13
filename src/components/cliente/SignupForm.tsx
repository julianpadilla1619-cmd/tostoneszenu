"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { submitSignupRequest } from "@/app/actions/public";
import { Button, Field, FormError, Input, Select, Spinner, Textarea } from "@/components/ui/ui";

export function SignupForm({ municipios, min }: { municipios: string[]; min: number }) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [municipio, setMunicipio] = useState("Tuchín");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const res = await submitSignupRequest(data);
      if (res.ok) {
        setError(null);
        setSent((res.data as string) ?? "");
        form.reset();
      } else setError(res.error);
    });
  }

  if (sent !== null)
    return (
      <div role="status" className="animate-subir flex flex-col items-start gap-4 rounded-[1.75rem] border border-oro/25 bg-tierra p-6">
        <CheckCircle2 className="size-12 text-oro" aria-hidden />
        <h3 className="font-display text-3xl font-black">¡Recibido{sent ? `, ${sent}` : ""}!</h3>
        <p className="text-cana/80">Te escribimos por WhatsApp para crearte la cuenta. Normalmente respondemos el mismo día.</p>
        <button onClick={() => setSent(null)} className="min-h-11 cursor-pointer text-sm text-cana/70 underline underline-offset-4">
          Enviar otra solicitud
        </button>
      </div>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-[1.75rem] border border-oro/20 bg-tierra/90 p-5 sm:p-6">
      <Field label="Tu nombre">{(id) => <Input id={id} name="name" required maxLength={80} autoComplete="name" placeholder="Ej. Rosa Montes" />}</Field>
      <Field label="Nombre del negocio (opcional)">
        {(id) => <Input id={id} name="business" maxLength={80} autoComplete="organization" placeholder="Tienda, cafetería, kiosco…" />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Celular (WhatsApp)">
          {(id) => <Input id={id} name="phone" required type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" />}
        </Field>
        <Field label="Correo (opcional)">
          {(id) => <Input id={id} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="tucorreo@gmail.com" />}
        </Field>
      </div>
      <Field label="Municipio">
        {(id) => (
          <Select id={id} name="municipality" value={municipio} onChange={(e) => setMunicipio(e.target.value)} required>
            {municipios.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        )}
      </Field>
      {municipio === "Otro" && (
        <Field label="¿Cuál municipio?">{(id) => <Input id={id} name="municipality_other" required maxLength={60} autoComplete="address-level2" />}</Field>
      )}
      <Field label="Paquetes por semana (aprox.)" hint={`Vendemos desde ${min} paquetes por pedido.`}>
        {(id) => <Input id={id} name="packs" type="number" inputMode="numeric" min={min} placeholder={`Ej. ${min * 3}`} />}
      </Field>
      <Field label="Mensaje (opcional)">{(id) => <Textarea id={id} name="message" rows={3} maxLength={500} placeholder="Cuéntanos de tu negocio" />}</Field>
      {/* Campo trampa para bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <FormError message={error} />
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending} icon={pending ? <Spinner /> : undefined}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </Button>
      <p className="text-center text-xs text-cana/60">Solo usamos tus datos para contactarte sobre tus pedidos.</p>
    </form>
  );
}
