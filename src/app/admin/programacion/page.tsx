import clsx from "clsx";
import { Suspense } from "react";
import { Clock, Truck } from "lucide-react";
import { toggleTask } from "@/app/actions/admin";
import { PageHead } from "@/components/admin/AdminShell";
import { TaskForm } from "@/components/admin/TaskForm";
import { TaskToggle } from "@/components/admin/TaskToggle";
import { Card, Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminProducts, getCatalog, ordersBetween, tasksBetween } from "@/lib/data";
import { addDays, cap, dayShort, hour12, plural, qty, weekdayName } from "@/lib/format";
import { TASK_LABEL } from "@/lib/labels";
import { consolidate } from "@/lib/selectors";
import { cutoffWeekday, deliveriesOfWeek, isoWeekday, orderWindow, todayBogota, WEEKDAY_NAMES } from "@/lib/time";
import type { TaskKind } from "@/lib/types";

const kindColor: Record<TaskKind, string> = {
  compra: "bg-serie-1",
  produccion: "bg-serie-2",
  empaque: "bg-oro-claro",
  entrega: "bg-serie-3",
  pago: "bg-serie-4",
  otro: "bg-tinta-2",
};

export default function ProgramacionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Programacion />
    </Suspense>
  );
}

async function Programacion() {
  await requirePage(["admin"]);
  const { settings } = await getCatalog();
  const today = todayBogota();
  const weekStart = orderWindow(settings).weekStart;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [tasks, orders, products] = await Promise.all([tasksBetween(weekStart, addDays(weekStart, 6)), ordersBetween(weekStart, weekStart), adminProducts()]);
  const deliveries = deliveriesOfWeek(weekStart, settings);
  const board = consolidate(orders, products);

  return (
    <>
      <PageHead title="Programación" sub={`Semana del ${dayShort(weekStart)}`} action={<TaskForm days={days} today={today} />} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((d) => {
          const list = tasks.filter((t) => t.day === d);
          const isDelivery = deliveries.includes(d);
          const closesFor = settings.deliveryWeekdays.filter((dw) => cutoffWeekday(dw, settings.cutoffDaysBefore) === isoWeekday(d));
          const dayInfo = board.byDay.find((x) => x.date === d);
          return (
            <Card key={d} className={clsx("flex flex-col", d === today && "ring-2 ring-oro", d < today && "opacity-70")}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-display text-xl font-bold">{cap(weekdayName(d))}</p>
                <p className="text-xs text-tinta-2">
                  {dayShort(d)}
                  {d === today && <span className="ml-1.5 rounded-full bg-oro px-1.5 py-0.5 font-bold text-noche">Hoy</span>}
                </p>
              </div>
              {closesFor.length > 0 && (
                <p className="mb-2 flex items-center gap-2 rounded-xl bg-oro/15 px-3 py-2 text-sm font-semibold text-oro-claro">
                  <Clock className="size-4 shrink-0" aria-hidden /> Cierre {hour12(settings.cutoffTime)} · pedidos del {closesFor.map((c) => WEEKDAY_NAMES[c].toLowerCase()).join(" y ")}
                </p>
              )}
              {isDelivery && (
                <p className="mb-2 flex items-center gap-2 rounded-xl bg-serie-3/20 px-3 py-2 text-sm font-semibold text-[#a9c6ea]">
                  <Truck className="size-4" aria-hidden /> Entrega: {dayInfo ? `${plural(dayInfo.orders, "pedido", "pedidos")} · ${qty(dayInfo.packs)} paq.` : "sin pedidos aún"}
                </p>
              )}
              <ul className="flex-1 space-y-1">
                {list.map((t) => (
                  <li key={t.id}>
                    <TaskToggle task={t} action={toggleTask.bind(null, t.id, !t.done)}>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-tinta-2">
                        <span className={clsx("size-2 rounded-full", kindColor[t.kind])} aria-hidden />
                        {TASK_LABEL[t.kind]}
                      </span>
                    </TaskToggle>
                  </li>
                ))}
                {list.length === 0 && !isDelivery && !closesFor.length && <li className="text-sm text-tinta-2">Sin tareas.</li>}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
