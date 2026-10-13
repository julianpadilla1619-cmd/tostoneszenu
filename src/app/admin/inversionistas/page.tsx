import { Suspense } from "react";
import { PageHead } from "@/components/admin/AdminShell";
import { InvestorForm } from "@/components/admin/InvestorForm";
import { InvestorPanel } from "@/components/admin/InvestorPanel";
import { Card, Empty, Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { investorsWithPayouts, profilesByRole } from "@/lib/data";
import { periodTotals } from "@/lib/investor-totals";

export default function InversionistasPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Inversionistas />
    </Suspense>
  );
}

async function Inversionistas() {
  await requirePage(["admin"]);
  const [{ investors, payouts }, totals, people] = await Promise.all([investorsWithPayouts(), periodTotals(), profilesByRole(["inversionista"])]);
  return (
    <>
      <PageHead title="Inversionistas" sub="Reparto automático de la ganancia neta según el porcentaje acordado." />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          {investors.length === 0 ? (
            <Empty title="Sin inversionistas">Agrega uno con el formulario para ver cuánto le corresponde de la ganancia.</Empty>
          ) : (
            investors.map((inv) => (
              <section key={inv.id} aria-label={inv.name}>
                <h2 className="mb-2 font-display text-xl font-bold">
                  {inv.name} · {inv.percentage} %
                </h2>
                <InvestorPanel investor={inv} totals={totals} payouts={payouts.filter((p) => p.investorId === inv.id)} />
              </section>
            ))
          )}
        </div>
        <Card className="h-fit">
          <InvestorForm investors={investors} accounts={people.map((p) => ({ id: p.id, name: p.fullName }))} />
          <p className="mt-4 rounded-xl bg-card-2 p-3 text-xs leading-relaxed text-tinta-2">
            Si le creas una cuenta de inversionista (en Clientes → Equipo) y la vinculas aquí, verá este mismo cálculo en solo lectura, sin el detalle de los gastos.
          </p>
        </Card>
      </div>
    </>
  );
}
