"use client";

import { Flame } from "lucide-react";
import { useState, useTransition } from "react";
import { addBatch } from "@/app/actions/admin";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Field, FormError, Input, Spinner, Textarea, useToast } from "@/components/ui/ui";
import type { Product } from "@/lib/types";

export function BatchForm({ products, today }: { products: Product[]; today: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [toast, showToast] = useToast();
  if (!products.length) return <p className="text-sm text-tinta-2">Primero crea un producto.</p>;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        data.set("product_id", productId);
        start(async () => {
          const r = await addBatch(data);
          if (!r.ok) return setError(r.error);
          setError(null);
          form.reset();
          showToast(r.message ?? "Guardado");
        });
      }}
    >
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Producto</legend>
        <div className="grid grid-cols-2 gap-2">
          {products.map((p) => (
            <label
              key={p.id}
              className={"flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center text-xs font-semibold transition " + (productId === p.id ? "border-oro bg-oro/10" : "border-linea")}
            >
              <input type="radio" name="product_pick" className="sr-only" checked={productId === p.id} onChange={() => setProductId(p.id)} />
              <ProductArt kind={p.category} className="size-9" />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Fecha">{(id) => <Input id={id} name="produced_on" type="date" defaultValue={today} max={today} required />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Paquetes producidos">{(id) => <Input id={id} name="units_produced" type="number" inputMode="numeric" min={1} required />}</Field>
        <Field label="De esos, dañados">{(id) => <Input id={id} name="units_waste" type="number" inputMode="numeric" min={0} defaultValue={0} />}</Field>
      </div>
      <Field label="Notas">{(id) => <Textarea id={id} name="notes" rows={2} maxLength={200} placeholder="Ej. plátano muy maduro" />}</Field>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : <Flame className="size-5" aria-hidden />}>
        {pending ? "Guardando…" : "Guardar lote"}
      </Button>
      {toast}
    </form>
  );
}
