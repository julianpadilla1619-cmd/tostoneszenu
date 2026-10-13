"use client";

import { useState, useTransition } from "react";
import { EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { deleteProduct, saveProduct } from "@/app/actions/admin";
import { ProductArt } from "@/components/brand/Brand";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button, Card, Empty, Field, FormError, Input, Pill, Select, Sheet, Spinner, Switch, Textarea, useToast } from "@/components/ui/ui";
import { money } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import type { Product } from "@/lib/types";

export function ProductosView({ products }: { products: Product[] }) {
  const [editing, setEditing] = useState<Product | "nuevo" | null>(null);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("nuevo")}>
          Nuevo producto
        </Button>
      </div>
      {products.length === 0 ? (
        <Empty title="Sin productos">Crea el primero para que tus clientes puedan pedir.</Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Card as="article" className={p.active ? "" : "opacity-60"}>
                <div className="flex items-start gap-3">
                  <ProductArt kind={p.category} className="size-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold leading-tight">{p.name}</p>
                    <p className="text-sm text-tinta-2">
                      {CATEGORY_LABEL[p.category]} · {p.weightGrams} g
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.featured && (
                        <Pill className="!bg-oro/20 !text-oro-claro">
                          <Star className="size-3" aria-hidden /> Destacado
                        </Pill>
                      )}
                      {!p.active && (
                        <Pill>
                          <EyeOff className="size-3" aria-hidden /> Oculto
                        </Pill>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setEditing(p)} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-card-2 hover:text-tinta" aria-label={`Editar ${p.name}`}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                </div>
                <dl className="tabular mt-4 grid grid-cols-3 gap-2 border-t border-linea pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-tinta-2">Precio</dt>
                    <dd className="font-bold">{money(p.price)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tinta-2">Costo</dt>
                    <dd>{money(p.unitCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tinta-2">Ganancia</dt>
                    <dd className={p.price - p.unitCost >= 0 ? "text-ok" : "text-mal"}>{money(p.price - p.unitCost)}</dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {editing && <ProductSheet product={editing === "nuevo" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ProductSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  return (
    <Sheet open onClose={onClose} title={product ? "Editar producto" : "Nuevo producto"}>
      <form
        className="flex flex-col gap-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          start(async () => {
            const r = await saveProduct(data);
            if (!r.ok) return setError(r.error);
            showToast(r.message ?? "Guardado");
            onClose();
          });
        }}
      >
        {product && <input type="hidden" name="id" value={product.id} />}
        <Field label="Nombre">{(id) => <Input id={id} name="name" required maxLength={60} defaultValue={product?.name ?? ""} placeholder="Ej. Tajadas de yuca" />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            {(id) => (
              <Select id={id} name="category" defaultValue={product?.category ?? "platano"}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Peso del paquete (g)">{(id) => <Input id={id} name="weight_grams" type="number" inputMode="numeric" min={1} required defaultValue={product?.weightGrams ?? 150} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio mayorista">{(id) => <Input id={id} name="price" type="number" inputMode="numeric" min={0} required defaultValue={product?.price ?? ""} />}</Field>
          <Field label="Costo por paquete" hint="Para calcular tu ganancia.">
            {(id) => <Input id={id} name="unit_cost" type="number" inputMode="numeric" min={0} defaultValue={product?.unitCost ?? ""} />}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aviso de poco inventario" hint="Paquetes.">
            {(id) => <Input id={id} name="low_stock_threshold" type="number" inputMode="numeric" min={0} defaultValue={product?.lowStockThreshold ?? 20} />}
          </Field>
          <Field label="Orden" hint="1 sale primero.">
            {(id) => <Input id={id} name="sort" type="number" inputMode="numeric" min={0} defaultValue={product?.sort ?? 10} />}
          </Field>
        </div>
        <Field label="Descripción">{(id) => <Textarea id={id} name="description" rows={3} maxLength={240} defaultValue={product?.description ?? ""} />}</Field>
        <Switch name="featured" defaultChecked={product?.featured ?? false} label="Destacado" hint="Sale primero en la página principal." />
        <Switch name="active" defaultChecked={product?.active ?? true} label="Disponible" hint="Si lo apagas, se oculta de la página y nadie lo puede pedir." />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : undefined}>
          {pending ? "Guardando…" : "Guardar producto"}
        </Button>
        {product && (
          <div className="border-t border-linea pt-3">
            <ActionButton
              variant="fantasma"
              icon={<Trash2 className="size-4" aria-hidden />}
              confirm={`¿Eliminar “${product.name}”? Si ya tiene pedidos se oculta en lugar de borrarse.`}
              action={async () => {
                const r = await deleteProduct(product.id);
                if (r.ok) onClose();
                return r;
              }}
            >
              Eliminar producto
            </ActionButton>
          </div>
        )}
      </form>
      {toast}
    </Sheet>
  );
}
