"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, Trash2 } from "lucide-react";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, Stepper, Textarea, useToast } from "@/components/ui/ui";
import { money, qty, weekRange } from "@/lib/format";
import { currentWeek } from "@/lib/selectors";
import { priceFor, useStore } from "@/lib/store";
import { cutoffLeft, cutoffText } from "@/lib/week";

export default function PedidoPage() {
  const { state, me, saveOrder } = useStore();
  const router = useRouter();
  const [toast, showToast] = useToast();
  const week = currentWeek(state);
  const existing = me ? state.orders.find((o) => o.customerId === me.id && o.weekId === week.id) : undefined;

  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(state.products.map((p) => [p.id, existing?.items.find((i) => i.productId === p.id)?.qty ?? 0])),
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!me) return null;
  const wholesale = me.role === "mayorista";
  const step = wholesale ? 10 : 1;
  const products = state.products.filter((p) => p.active);
  const totalPacks = products.reduce((a, p) => a + (qtys[p.id] ?? 0), 0);
  const total = products.reduce((a, p) => a + (qtys[p.id] ?? 0) * priceFor(p, me.role), 0);
  const min = wholesale ? state.settings.wholesaleMinPacks : 1;
  const open = cutoffLeft(week).open;
  const locked = !open || (existing && ["en_produccion", "en_camino", "entregado"].includes(existing.status));

  function confirm() {
    if (totalPacks < min) {
      setError(wholesale ? `El pedido mayorista es desde ${min} paquetes.` : "Agrega al menos 1 paquete.");
      return;
    }
    saveOrder(me!.id, week.id, qtys, note.trim(), "confirmado");
    showToast("¡Listo, tu pedido quedó montado!");
    setTimeout(() => router.push("/app"), 900);
  }

  function cancel() {
    saveOrder(me!.id, week.id, {}, undefined, "cancelado");
    router.push("/app");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/app" className="grid size-10 place-items-center rounded-full bg-card-2" aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black leading-tight">¿Cuántos te mandamos?</h1>
          <p className="text-sm text-tinta-2">
            Semana {weekRange(week.startsOn)} · {cutoffText(week)}
          </p>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-3 rounded-2xl bg-noche p-4 text-cana">
          <Lock className="size-5 text-oro" />
          <p className="text-sm">Este pedido ya está cerrado. Si necesitas un cambio, escríbenos por WhatsApp.</p>
        </div>
      )}

      {products.map((p, i) => {
        const price = priceFor(p, me.role);
        const q = qtys[p.id] ?? 0;
        return (
          <Card key={p.id} className="animate-subir" as="article">
            <div className="flex items-center gap-4" style={{ animationDelay: `${i * 70}ms` }}>
              <ProductArt kind={p.kind} className="size-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold leading-tight">{p.name}</h2>
                <p className="text-sm text-tinta-2">{p.presentation}</p>
                <p className="tabular mt-1 font-semibold">
                  {money(price)} <span className="text-xs font-normal text-tinta-2">/ paquete</span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Stepper label={p.name} value={q} step={step} onChange={(n) => (setError(null), setQtys((s) => ({ ...s, [p.id]: n })))} disabled={locked} />
              <p className="tabular text-right text-sm text-tinta-2">
                Subtotal
                <span className="block font-display text-lg font-bold text-tinta">{money(q * price)}</span>
              </p>
            </div>
            {wholesale && !locked && (
              <div className="mt-3 flex gap-2">
                {[20, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQtys((s) => ({ ...s, [p.id]: n }))}
                    className={"h-9 flex-1 cursor-pointer rounded-xl text-sm font-semibold transition " + (q === n ? "bg-noche text-oro" : "bg-card-2 text-tinta-2")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card>
        <label htmlFor="nota" className="text-sm font-semibold">
          Nota para el pedido (opcional)
        </label>
        <Textarea id="nota" className="mt-2" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. entregar después de las 10 a. m." disabled={locked} />
      </Card>

      {existing && existing.items.length > 0 && !locked && (
        <Button variant="peligro" onClick={cancel} icon={<Trash2 className="size-4" />}>
          Cancelar pedido de esta semana
        </Button>
      )}

      {/* Barra de total */}
      {!locked && (
        <div className="pb-safe fixed inset-x-0 bottom-[4.6rem] z-30 mx-auto max-w-md px-4">
          <div className="flex items-center gap-3 rounded-[1.5rem] bg-noche p-3 pl-5 text-cana shadow-2xl ring-1 ring-oro/25">
            <div className="min-w-0 flex-1">
              <p className="tabular text-xs text-cana/60">
                {qty(totalPacks)} paquetes{wholesale && totalPacks < min ? ` · mínimo ${min}` : ""}
              </p>
              <p className="tabular font-display text-2xl font-black text-oro">{money(total)}</p>
            </div>
            <Button onClick={confirm} disabled={totalPacks === 0} icon={<CheckCircle2 className="size-5" />}>
              Confirmar
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-2 rounded-xl bg-mal px-3 py-2 text-center text-sm font-semibold text-cana">
              {error}
            </p>
          )}
        </div>
      )}
      <div className="h-24" />
      {toast}
    </div>
  );
}
