import clsx from "clsx";
import { Clock, ShoppingBasket, Truck } from "lucide-react";
import { hour12 } from "@/lib/format";
import { cutoffWeekday, WEEKDAY_NAMES } from "@/lib/time";

/**
 * Semana tipo (lunes a domingo) según los ajustes: días de entrega y el día en que
 * cierra cada una (entrega − días de anticipación, a la hora límite).
 */
export function WeekCalendar({ deliveryWeekdays, cutoffTime, cutoffDaysBefore }: { deliveryWeekdays: number[]; cutoffTime: string; cutoffDaysBefore: number }) {
  const closes = new Map<number, number[]>(); // día de cierre → entregas que cierran ese día
  for (const d of [...deliveryWeekdays].sort((a, b) => a - b)) {
    const c = cutoffWeekday(d, cutoffDaysBefore);
    closes.set(c, [...(closes.get(c) ?? []), d]);
  }

  return (
    <ol className="grid gap-2 md:grid-cols-7" aria-label="Calendario de la semana">
      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const delivery = deliveryWeekdays.includes(d);
        const closing = closes.get(d) ?? [];
        return (
          <li
            key={d}
            className={clsx(
              "flex items-center gap-3 rounded-2xl p-3 md:min-h-40 md:flex-col md:items-start md:justify-between",
              delivery ? "bg-cafe text-cana" : closing.length ? "bg-noche text-cana" : "border border-linea bg-card",
            )}
          >
            <span className="w-24 shrink-0 font-display text-xl font-black md:w-auto md:text-2xl">
              <span className="md:hidden">{WEEKDAY_NAMES[d]}</span>
              <span className="hidden md:inline">{WEEKDAY_NAMES[d].slice(0, 3)}</span>
            </span>
            <span className="flex flex-col gap-1.5 text-sm font-semibold leading-tight">
              {delivery && (
                <span className="flex items-center gap-1.5">
                  <Truck className="size-4 shrink-0 text-oro-claro" aria-hidden /> Día de entrega
                </span>
              )}
              {closing.map((c) => (
                <span key={c} className={clsx("flex items-start gap-1.5", delivery ? "text-cana/90" : "text-oro-claro")}>
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden /> Pide hasta las {hour12(cutoffTime)} para el {WEEKDAY_NAMES[c].toLowerCase()}
                </span>
              ))}
              {!delivery && !closing.length && (
                <span className="flex items-center gap-1.5 text-tinta-2">
                  <ShoppingBasket className="size-4 shrink-0" aria-hidden /> Puedes pedir
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
