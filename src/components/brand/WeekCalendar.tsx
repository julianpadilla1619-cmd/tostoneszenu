import clsx from "clsx";
import { Clock, ShoppingBasket, Truck } from "lucide-react";
import { hour12 } from "@/lib/format";
import { WEEKDAY_NAMES } from "@/lib/time";

/**
 * Calendario de la semana tipo (lunes a domingo) a partir de los ajustes:
 * días de entrega y último día para pedir (el día anterior a cada entrega).
 */
export function WeekCalendar({ deliveryWeekdays, cutoffTime }: { deliveryWeekdays: number[]; cutoffTime: string }) {
  const days = [1, 2, 3, 4, 5, 6, 7].map((d) => {
    const delivery = deliveryWeekdays.includes(d);
    const lastDay = deliveryWeekdays.includes(d === 7 ? 1 : d + 1);
    return { d, delivery, lastDay };
  });

  return (
    <ol className="grid gap-2 md:grid-cols-7" aria-label="Calendario de la semana">
      {days.map(({ d, delivery, lastDay }) => (
        <li
          key={d}
          className={clsx(
            "flex items-center gap-3 rounded-2xl p-3 md:min-h-40 md:flex-col md:items-start md:justify-between",
            delivery ? "bg-cafe text-cana" : lastDay ? "bg-noche text-cana" : "border border-linea bg-card",
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
            {lastDay && (
              <span className={clsx("flex items-center gap-1.5", delivery ? "text-cana/90" : "text-oro-claro")}>
                <Clock className="size-4 shrink-0" aria-hidden /> Pide hasta las {hour12(cutoffTime)}
              </span>
            )}
            {!delivery && !lastDay && (
              <span className="flex items-center gap-1.5 text-tinta-2">
                <ShoppingBasket className="size-4 shrink-0" aria-hidden /> Puedes pedir
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
