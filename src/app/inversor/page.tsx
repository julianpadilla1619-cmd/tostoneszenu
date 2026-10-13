import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { InvestorPanel } from "@/components/admin/InvestorPanel";
import { Logo, Wordmark } from "@/components/brand/Brand";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { investorsWithPayouts } from "@/lib/data";
import { periodTotals } from "@/lib/investor-totals";

export const metadata: Metadata = { title: "Mis ganancias", robots: { index: false } };

export default function InversorPage() {
  return (
    <div className="tema-oscuro rombos-oscuro min-h-dvh bg-fondo text-tinta">
      <header className="flex min-h-16 items-center justify-between border-b border-linea px-4 py-2">
        <div className="flex items-center gap-2.5">
          <Logo size={38} />
          <Wordmark dark />
        </div>
        <form action={signOut}>
          <button className="grid size-11 cursor-pointer place-items-center rounded-full bg-card text-tinta-2" aria-label="Cerrar sesión">
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </header>
      <main id="contenido" className="mx-auto max-w-3xl px-4 pb-12 pt-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Content />
        </Suspense>
      </main>
    </div>
  );
}

async function Content() {
  const me = await requirePage(["inversionista", "admin"]);
  const [{ investors, payouts }, totals] = await Promise.all([investorsWithPayouts(), periodTotals()]);
  const investor = investors.find((i) => i.profileId === me.id);
  return (
    <>
      <p className="text-sm text-tinta-2">Hola, {me.fullName.split(" ")[0]}</p>
      <h1 className="mb-5 font-display text-3xl font-black">Tus ganancias</h1>
      {investor ? (
        <InvestorPanel investor={investor} totals={totals} payouts={payouts.filter((p) => p.investorId === investor.id)} readOnly />
      ) : (
        <p className="text-tinta-2">Tu cuenta todavía no está vinculada a un porcentaje. Pídele al administrador que la vincule.</p>
      )}
    </>
  );
}
