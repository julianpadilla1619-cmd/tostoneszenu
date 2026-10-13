import { Suspense } from "react";
import { PageHead } from "@/components/admin/AdminShell";
import { ClientesView } from "@/components/admin/ClientesView";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { profilesByRole, signupRequests } from "@/lib/data";
import { MUNICIPIOS } from "@/lib/labels";
import { plural } from "@/lib/format";

export default function ClientesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Clientes />
    </Suspense>
  );
}

async function Clientes() {
  const me = await requirePage(["admin"]);
  const [requests, people] = await Promise.all([signupRequests("todas"), profilesByRole(["mayorista", "inversionista", "admin"])]);
  const customers = people.filter((p) => p.role === "mayorista");
  return (
    <>
      <PageHead title="Clientes" sub={plural(customers.filter((c) => c.status === "activo").length, "cliente activo", "clientes activos")} />
      <ClientesView
        meId={me.id}
        requests={requests}
        customers={customers}
        team={people.filter((p) => p.role !== "mayorista")}
        municipios={MUNICIPIOS}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      />
    </>
  );
}
