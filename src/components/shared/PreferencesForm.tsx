"use client";

import { BellRing, BellOff, Smartphone } from "lucide-react";
import { useState, useTransition } from "react";
import { updateMyPreferences } from "@/app/actions/cliente";
import { usePwa } from "@/components/pwa/usePwa";
import { Button, Card, CardTitle, Field, FormError, Input, Spinner, Switch, useToast } from "@/components/ui/ui";
import type { Profile } from "@/lib/types";

/** Correo, dirección y cómo quiere recibir avisos. Incluye activar push en ESTE celular. */
export function PreferencesForm({ profile, showAddress }: { profile: Profile; showAddress?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const pwa = usePwa();

  return (
    <>
      <Card>
        <CardTitle>Avisos</CardTitle>
        <div className="rounded-2xl bg-card-2 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="size-4" aria-hidden /> Notificaciones en este celular
          </p>
          <p className="mt-1 text-xs text-tinta-2">Te avisamos cuando tu pedido va en camino y el día antes de cada entrega.</p>
          {pwa.push === "unsupported" ? (
            <p className="mt-2 text-xs text-tinta-2">
              {pwa.isIOS && !pwa.standalone
                ? "En iPhone primero instala la app (Compartir → “Agregar a inicio”) y ábrela desde el ícono."
                : "Este navegador no permite notificaciones."}
            </p>
          ) : pwa.push === "denied" ? (
            <p className="mt-2 text-xs text-mal">Las bloqueaste. Actívalas en los ajustes del navegador para este sitio.</p>
          ) : (
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              variant={pwa.push === "on" ? "borde" : "noche"}
              disabled={pwa.push === "loading"}
              icon={pwa.push === "loading" ? <Spinner /> : pwa.push === "on" ? <BellOff className="size-4" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
              onClick={async () => {
                if (pwa.push === "on") return pwa.disablePush();
                const err = await pwa.enablePush();
                showToast(err ?? "Listo, te llegarán los avisos a este celular.");
              }}
            >
              {pwa.push === "on" ? "Desactivar en este celular" : "Activar en este celular"}
            </Button>
          )}
        </div>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            start(async () => {
              const r = await updateMyPreferences(data);
              setError(r.ok ? null : r.error);
              if (r.ok) showToast("Preferencias guardadas");
            });
          }}
        >
          <Field label="Correo (opcional)" hint="Para recibir los avisos también por correo.">
            {(id) => <Input id={id} name="email" type="email" autoComplete="email" defaultValue={profile.email ?? ""} placeholder="tucorreo@gmail.com" />}
          </Field>
          {showAddress && (
            <Field label="Dirección de entrega">{(id) => <Input id={id} name="address" autoComplete="street-address" maxLength={160} defaultValue={profile.address ?? ""} />}</Field>
          )}
          <Switch name="notify_push" defaultChecked={profile.notifyPush} label="Avisos en el celular" />
          <Switch name="notify_email" defaultChecked={profile.notifyEmail} label="Avisos por correo" hint="Solo si escribiste un correo arriba." />
          <FormError message={error} />
          <Button type="submit" variant="suave" disabled={pending} icon={pending ? <Spinner /> : undefined}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </Card>
      {toast}
    </>
  );
}
