"use client";

import Link from "next/link";
import { Download, KeyRound, Share } from "lucide-react";
import { usePwa } from "@/components/pwa/usePwa";
import { Button, Card, CardTitle } from "@/components/ui/ui";

/** Instalar la app en el celular y cambiar la contraseña. */
export function AccountActions() {
  const pwa = usePwa();
  return (
    <>
      {!pwa.standalone && (
        <Card>
          <CardTitle>Instala la app</CardTitle>
          <p className="mb-3 text-sm text-tinta-2">Queda como un ícono en tu pantalla de inicio y abre más rápido.</p>
          {pwa.canInstall ? (
            <Button className="w-full" onClick={pwa.install} icon={<Download className="size-5" aria-hidden />}>
              Agregar a la pantalla de inicio
            </Button>
          ) : pwa.isIOS ? (
            <p className="text-sm text-tinta-2">
              En Safari toca <Share className="inline size-4" aria-label="Compartir" /> <b>Compartir</b> y luego <b>“Agregar a inicio”</b>.
            </p>
          ) : (
            <p className="text-sm text-tinta-2">
              En Chrome abre el menú <b>⋮</b> y elige <b>“Instalar app”</b> o <b>“Agregar a la pantalla principal”</b>.
            </p>
          )}
        </Card>
      )}
      <Link href="/cambiar-clave" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-card-2 font-semibold">
        <KeyRound className="size-4" aria-hidden /> Cambiar contraseña
      </Link>
    </>
  );
}
