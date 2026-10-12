"use client";

import { useRouter } from "next/navigation";
import { BellRing, Download, LogOut, MapPin, Phone, RotateCcw, Share, Store } from "lucide-react";
import { usePwa } from "@/components/pwa/usePwa";
import { Button, Card, CardTitle, Pill, useToast } from "@/components/ui/ui";
import { initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function PerfilPage() {
  const { me, dispatch } = useStore();
  const router = useRouter();
  const pwa = usePwa();
  const [toast, showToast] = useToast();
  if (!me) return null;

  async function notif() {
    const r = await pwa.enableNotifications();
    showToast(r === "granted" ? "Notificaciones activadas" : r === "denied" ? "Las bloqueaste en el navegador" : "Tu navegador no las soporta");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-[1.25rem] bg-noche font-display text-2xl font-black text-oro">{initials(me.fullName)}</span>
        <div>
          <h1 className="font-display text-2xl font-black leading-tight">{me.fullName}</h1>
          <Pill className="mt-1">{ROLE_LABEL[me.role]}</Pill>
        </div>
      </div>

      <Card>
        <CardTitle>Mis datos</CardTitle>
        <dl className="space-y-3 text-sm">
          {me.businessName && <Row icon={<Store className="size-4" />} k="Negocio" v={me.businessName} />}
          <Row icon={<Phone className="size-4" />} k="Celular" v={me.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")} />
          <Row icon={<MapPin className="size-4" />} k="Entrega" v={`${me.address ?? "Sin dirección"} · ${me.municipality}`} />
        </dl>
        <p className="mt-3 text-xs text-tinta-2">¿Algo cambió? Escríbenos y lo actualizamos.</p>
      </Card>

      <Card>
        <CardTitle>Notificaciones</CardTitle>
        <p className="text-sm text-tinta-2">Te avisamos el jueves si no has pedido y el sábado cuando tu pedido va en camino.</p>
        <Button
          className="mt-3 w-full"
          variant={pwa.permission === "granted" ? "suave" : "noche"}
          onClick={notif}
          icon={<BellRing className="size-5" />}
          disabled={pwa.permission === "granted"}
        >
          {pwa.permission === "granted" ? "Activadas" : "Activar notificaciones"}
        </Button>
      </Card>

      {!pwa.standalone && (
        <Card>
          <CardTitle>Instala la app</CardTitle>
          {pwa.canInstall ? (
            <Button className="w-full" onClick={pwa.install} icon={<Download className="size-5" />}>
              Agregar a mi pantalla de inicio
            </Button>
          ) : pwa.isIOS ? (
            <p className="text-sm text-tinta-2">
              En Safari toca <Share className="inline size-4" /> <b>Compartir</b> y luego <b>“Agregar a inicio”</b>.
            </p>
          ) : (
            <p className="text-sm text-tinta-2">
              En Chrome abre el menú ⋮ y elige <b>“Instalar app”</b> o <b>“Agregar a la pantalla principal”</b>.
            </p>
          )}
        </Card>
      )}

      <Button
        variant="borde"
        icon={<LogOut className="size-5" />}
        onClick={() => {
          dispatch({ type: "logout" });
          router.push("/login");
        }}
      >
        Cerrar sesión
      </Button>
      <button
        onClick={() => {
          dispatch({ type: "reset" });
          showToast("Datos de prueba reiniciados");
        }}
        className="mx-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-tinta-2 underline-offset-4 hover:underline"
      >
        <RotateCcw className="size-3.5" /> Reiniciar datos de prueba
      </button>
      {toast}
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-tinta-2">{icon}</span>
      <dt className="w-16 shrink-0 text-tinta-2">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
