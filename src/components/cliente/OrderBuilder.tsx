"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, Lock, RotateCcw } from "lucide-react";
import { saveMyOrder } from "@/app/actions/cliente";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, Spinner, Stepper, Textarea, useToast } from "@/components/ui/ui";
import { dayLong, dayShort, hour12, money, qty } from "@/lib/format";
import type { Order, Product } from "@/lib/types";

interface Props {
  products: Product[];
  min: number;
  cutoffTime: string;
  weekStart: string;
  deliveries: { date: string; cutoff: string }[];
  current: Order | null;
  previous: Order | null;
  locked: boolean;
  whatsapp: string | null;
}

export function OrderBuilder({ products, min, cutoffTime, weekStart, deliveries, current, previous, locked, whatsapp }: Props) {
  const router = useRouter();
  const [toast, showToast] = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initialFrom = (o: Order | null) => Object.fromEntries(products.map((p) => [p.id, o?.items.find((i) => i.productId === p.id)?.qty ?? 0]));
  const [qtys, setQtys] = useState<Record<string, number>>(() => initialFrom(current));
  const [note, setNote] = useState(current?.note ?? "");
  const [delivery, setDelivery] = useState(() =>
    current?.deliveryOn && deliveries.some((d) => d.date === current.deliveryOn) ? current.deliveryOn : (deliveries[0]?.date ?? ""),
  );

  const totalPacks = products.reduce((a, p) => a + (qtys[p.id] ?? 0), 0);
  const total = products.reduce((a, p) => a + (qtys[p.id] ?? 0) * p.price, 0);
  const missing = Math.max(0, min - totalPacks);
  const set = (id: string, n: number) => {
    setError(null);
    setQtys((s) => ({ ...s, [id]: n }));
  };

  function confirm() {
    if (missing > 0) return setError(`Te faltan ${missing} paquetes para el pedido mínimo de ${min}.`);
    if (!delivery) return setError("Elige el día de entrega.");
    start(async () => {
      const r = await saveMyOrder({ deliveryOn: delivery, items: products.map((p) => ({ productId: p.id, qty: qtys[p.id] ?? 0 })), note });
      if (!r.ok) return setError(r.error);
      showToast(r.message ?? "Pedido guardado");
      router.push("/app");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/app" className="grid size-11 shrink-0 place-items-center rounded-full bg-card-2" aria-label="Volver al inicio">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black leading-tight">¿Cuántos te mandamos?</h1>
          <p className="text-sm text-tinta-2">Semana del {dayShort(weekStart)} · mínimo {min} paquetes</p>
        </div>
      </div>

      {locked ? (
        <div className="flex items-start gap-3 rounded-2xl bg-noche p-4 text-cana">
          <Lock className="mt-0.5 size-5 shrink-0 text-oro" aria-hidden />
          <p className="text-sm">
            {deliveries.length === 0 ? "Los pedidos de esta semana ya cerraron." : "Tu pedido ya está en producción, así que no se puede cambiar."}{" "}
            {whatsapp && (
              <a className="font-semibold text-oro underline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                Escríbenos por WhatsApp
              </a>
            )}
          </p>
        </div>
      ) : (
        <fieldset className="rounded-[var(--radius-card)] border border-linea bg-card p-4">
          <legend className="sr-only">Día de entrega</legend>
          <p className="mb-2 text-sm font-semibold">¿Qué día te lo llevamos?</p>
          <div className="grid grid-cols-2 gap-2">
            {deliveries.map((d) => (
              <label
                key={d.date}
                className={clsx(
                  "flex min-h-14 cursor-pointer flex-col justify-center rounded-2xl border-2 px-3 py-2 transition",
                  delivery === d.date ? "border-oro bg-oro/15" : "border-linea",
                )}
              >
                <input type="radio" name="delivery" value={d.date} checked={delivery === d.date} onChange={() => setDelivery(d.date)} className="sr-only" />
                <span className="font-semibold">{dayLong(d.date)}</span>
                <span className="text-xs text-tinta-2">Pides hasta {hour12(cutoffTime)} del día antes</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {previous && !locked && totalPacks === 0 && (
        <button
          type="button"
          onClick={() => setQtys(initialFrom(previous))}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-linea text-sm font-semibold text-tinta-2 hover:text-tinta"
        >
          <RotateCcw className="size-4" aria-hidden /> Copiar mi pedido anterior ({qty(previous.items.reduce((a, i) => a + i.qty, 0))} paquetes)
        </button>
      )}

      <ul className="flex flex-col gap-3">
        {products.map((p) => {
          const q = qtys[p.id] ?? 0;
          return (
            <li key={p.id}>
              <Card as="article" className={clsx(q > 0 && "border-oro/50")}>
                <div className="flex items-center gap-4">
                  <ProductArt kind={p.category} className="size-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold leading-tight">{p.name}</h2>
                    <p className="text-sm text-tinta-2">Paquete de {p.weightGrams} g</p>
                    <p className="tabular mt-0.5 font-semibold">
                      {money(p.price)} <span className="text-xs font-normal text-tinta-2">c/u</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Stepper label={p.name} value={q} step={1} max={5000} onChange={(n) => set(p.id, n)} disabled={locked} />
                  <p className="tabular text-right text-sm text-tinta-2">
                    Subtotal
                    <span className="block font-display text-lg font-bold text-tinta">{money(q * p.price)}</span>
                  </p>
                </div>
                {!locked && (
                  <div className="mt-3 flex gap-2" role="group" aria-label={`Cantidades rápidas de ${p.name}`}>
                    {[10, 20, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set(p.id, q + n)}
                        className="h-11 flex-1 cursor-pointer rounded-xl bg-card-2 text-sm font-semibold text-tinta-2 transition active:scale-95"
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      {!locked && (
        <Card>
          <label htmlFor="nota" className="text-sm font-semibold">
            Nota para el pedido (opcional)
          </label>
          <Textarea id="nota" className="mt-2" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. entregar después de las 10 a. m." />
        </Card>
      )}

      {!locked && (
        <div className="pb-safe fixed inset-x-0 bottom-[4.75rem] z-30 mx-auto max-w-md px-4">
          {error && (
            <p role="alert" className="rounded-xl bg-mal px-3 py-2 text-center text-sm font-semibold text-white shadow-lg">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 rounded-[1.5rem] bg-noche p-3 pl-5 text-cana shadow-2xl ring-1 ring-oro/25">
            <div className="min-w-0 flex-1" aria-live="polite">
              <p className="tabular text-xs text-cana/70">{missing > 0 ? `${qty(totalPacks)} de ${min} paquetes mínimos` : `${qty(totalPacks)} paquetes`}</p>
              <p className="tabular font-display text-2xl font-black text-oro">{money(total)}</p>
            </div>
            <Button onClick={confirm} disabled={pending || totalPacks === 0} icon={pending ? <Spinner /> : <CheckCircle2 className="size-5" aria-hidden />}>
              {pending ? "Guardando…" : current?.items.length ? "Guardar cambios" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
      <div className="h-28" aria-hidden />
      {toast}
    </div>
  );
}
