"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/ui";
import { MUNICIPIOS } from "@/lib/labels";
import { DEMO_TODAY, settings } from "@/lib/mock-data";
import { newId, useStore } from "@/lib/store";

export function SignupForm() {
  const { dispatch } = useStore();
  const [tipo, setTipo] = useState<"regular" | "mayorista">("mayorista");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const phone = String(f.get("phone") ?? "").replace(/\D/g, "");
    if (phone.length !== 10 || !phone.startsWith("3")) {
      setError("Escribe un celular de 10 dígitos que empiece por 3.");
      return;
    }
    const fullName = String(f.get("name") ?? "").trim();
    dispatch({
      type: "addRequest",
      request: {
        id: newId("r"),
        fullName,
        phone,
        municipality: String(f.get("municipality")),
        businessName: String(f.get("business") ?? "").trim() || undefined,
        requestedRole: tipo,
        estWeeklyPacks: Number(f.get("packs")) || undefined,
        message: String(f.get("message") ?? "").trim() || undefined,
        status: "nueva",
        createdAt: DEMO_TODAY,
      },
    });
    setError(null);
    setSent(fullName.split(" ")[0] ?? "");
  }

  if (sent !== null)
    return (
      <div className="animate-subir flex flex-col items-start gap-4 rounded-[1.75rem] border border-oro/25 bg-tierra p-6">
        <CheckCircle2 className="size-12 text-oro" />
        <h3 className="font-display text-3xl font-black">¡Listo, {sent}!</h3>
        <p className="text-cana/75">Recibimos tu solicitud. Te escribimos por WhatsApp para activarte la cuenta y darte tu precio.</p>
        <a
          href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hola, acabo de enviar mi solicitud para ser cliente de Tostones Zenú.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-oro px-5 font-bold text-noche"
        >
          <MessageCircle className="size-5" /> Escribir por WhatsApp
        </a>
        <button onClick={() => setSent(null)} className="cursor-pointer text-sm text-cana/60 underline underline-offset-4">
          Enviar otra solicitud
        </button>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-[1.75rem] border border-oro/20 bg-tierra/90 p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-noche p-1.5" role="radiogroup" aria-label="Tipo de cliente">
        {(["mayorista", "regular"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={"h-11 cursor-pointer rounded-xl text-sm font-bold transition " + (tipo === t ? "bg-oro text-noche" : "text-cana/60 hover:text-cana")}
          >
            {t === "mayorista" ? "Soy mayorista" : "Cliente regular"}
          </button>
        ))}
      </div>
      <Field label="Nombre completo">{(id) => <Input id={id} name="name" required autoComplete="name" placeholder="Ej. Rosa Montes" />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Celular / WhatsApp">
          {(id) => <Input id={id} name="phone" required inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" />}
        </Field>
        <Field label="Municipio">
          {(id) => (
            <Select id={id} name="municipality" defaultValue="Tuchín">
              {MUNICIPIOS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del negocio (opcional)">{(id) => <Input id={id} name="business" placeholder="Tienda, kiosko…" />}</Field>
        <Field label="Paquetes por semana (aprox.)">
          {(id) => <Input id={id} name="packs" inputMode="numeric" placeholder={tipo === "mayorista" ? "Ej. 60" : "Ej. 10"} />}
        </Field>
      </div>
      <Field label="Mensaje (opcional)">{(id) => <Textarea id={id} name="message" rows={3} placeholder="Cuéntanos de tu negocio" />}</Field>
      {error && <p className="rounded-xl bg-mal/15 px-3 py-2 text-sm text-mal" role="alert">{error}</p>}
      <Button type="submit" size="lg" className="mt-1 w-full">
        Enviar solicitud
      </Button>
      <p className="text-center text-xs text-cana/45">Usamos tus datos solo para contactarte sobre tus pedidos.</p>
    </form>
  );
}
