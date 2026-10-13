import { Suspense } from "react";
import { MapPin, Phone, Store } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AccountActions } from "@/components/shared/AccountActions";
import { PreferencesForm } from "@/components/shared/PreferencesForm";
import { Card, CardTitle, Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { initials } from "@/lib/format";

export default function PerfilPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Perfil />
    </Suspense>
  );
}

async function Perfil() {
  const me = await requirePage(["mayorista"]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-[1.25rem] bg-noche font-display text-2xl font-black text-oro" aria-hidden>
          {initials(me.businessName ?? me.fullName)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-black leading-tight">{me.businessName ?? me.fullName}</h1>
          <p className="text-sm text-tinta-2">{me.fullName}</p>
        </div>
      </div>

      <Card>
        <CardTitle>Mis datos</CardTitle>
        <dl className="space-y-3 text-sm">
          {me.businessName && <Row icon={<Store className="size-4" />} k="Negocio" v={me.businessName} />}
          <Row icon={<Phone className="size-4" />} k="Celular" v={(me.phone ?? "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")} />
          <Row icon={<MapPin className="size-4" />} k="Municipio" v={me.municipality ?? "—"} />
        </dl>
        <p className="mt-3 text-xs text-tinta-2">Para cambiar el nombre, el negocio o el celular, escríbenos por WhatsApp.</p>
      </Card>

      <PreferencesForm profile={me} showAddress />
      <AccountActions />

      <form action={signOut}>
        <button className="min-h-12 w-full cursor-pointer rounded-2xl border border-linea font-semibold text-tinta-2 hover:text-tinta">Cerrar sesión</button>
      </form>
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-tinta-2" aria-hidden>
        {icon}
      </span>
      <dt className="w-20 shrink-0 text-tinta-2">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
