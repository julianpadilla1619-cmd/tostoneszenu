import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { PedidosView } from "@/components/admin/PedidosView";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminProducts, getCatalog, ordersBetween, profilesByRole } from "@/lib/data";
import { addDays, dayShort } from "@/lib/format";
import { deliveriesOfWeek, mondayOf, orderWindow } from "@/lib/time";

export default function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Pedidos searchParams={searchParams} />
    </Suspense>
  );
}

async function Pedidos({ searchParams }: { searchParams: PageProps<"/admin/pedidos">["searchParams"] }) {
  await requirePage(["admin"]);
  const { settings } = await getCatalog();
  const sp = await searchParams;
  const raw = typeof sp.semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.semana) ? sp.semana : null;
  const current = orderWindow(settings).weekStart;
  const weekStart = raw ? mondayOf(raw) : current;
  const [products, orders, customers] = await Promise.all([adminProducts(), ordersBetween(weekStart, weekStart), profilesByRole(["mayorista"])]);

  return (
    <>
      <PageHead
        title="Pedidos"
        sub={weekStart === current ? `Semana actual · del ${dayShort(weekStart)}` : `Semana del ${dayShort(weekStart)}`}
        action={
          <nav className="flex items-center gap-1" aria-label="Cambiar de semana">
            <Link href={`/admin/pedidos?semana=${addDays(weekStart, -7)}`} className="grid size-11 place-items-center rounded-xl bg-card-2" aria-label="Semana anterior">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            {weekStart !== current && (
              <Link href="/admin/pedidos" className="flex h-11 items-center rounded-xl bg-card-2 px-3 text-sm font-semibold">
                Hoy
              </Link>
            )}
            <Link href={`/admin/pedidos?semana=${addDays(weekStart, 7)}`} className="grid size-11 place-items-center rounded-xl bg-card-2" aria-label="Semana siguiente">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </nav>
        }
      />
      <PedidosView
        key={weekStart}
        weekStart={weekStart}
        deliveries={deliveriesOfWeek(weekStart, settings)}
        products={products}
        orders={orders}
        customers={customers.filter((c) => c.status === "activo" || orders.some((o) => o.customerId === c.id))}
      />
    </>
  );
}
