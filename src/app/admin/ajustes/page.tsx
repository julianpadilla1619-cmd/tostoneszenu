"use client";

import { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductArt } from "@/components/brand/Brand";
import { Button, Card, CardTitle, Field, Input, Select, useToast } from "@/components/ui/ui";
import { money } from "@/lib/format";
import { newId, useStore } from "@/lib/store";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Ajustes() {
  const { state, dispatch } = useStore();
  const [toast, showToast] = useToast();
  const s = state.settings;
  const roots = state.categories.filter((c) => !c.parentId);
  const [newCat, setNewCat] = useState<Record<string, string>>({});

  return (
    <>
      <PageHead title="Ajustes" sub="Reglas de la semana, productos, precios y categorías de gasto." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Semana de pedidos</CardTitle>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              dispatch({
                type: "updateSettings",
                settings: {
                  ...s,
                  cutoffWeekday: Number(f.get("cutoffWeekday")),
                  cutoffTime: String(f.get("cutoffTime")),
                  deliveryWeekday: Number(f.get("deliveryWeekday")),
                  wholesaleMinPacks: Number(f.get("min")) || 0,
                  reminderWeekday: Number(f.get("reminderWeekday")),
                  reminderTime: String(f.get("reminderTime")),
                  whatsapp: String(f.get("whatsapp")).replace(/\D/g, ""),
                },
              });
              showToast("Ajustes guardados");
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <DaySelect name="cutoffWeekday" label="Día de corte" value={s.cutoffWeekday} />
              <Field label="Hora de corte">{(id) => <Input id={id} name="cutoffTime" type="time" defaultValue={s.cutoffTime} />}</Field>
              <DaySelect name="reminderWeekday" label="Recordatorio push" value={s.reminderWeekday} />
              <Field label="Hora recordatorio">{(id) => <Input id={id} name="reminderTime" type="time" defaultValue={s.reminderTime} />}</Field>
              <DaySelect name="deliveryWeekday" label="Día de entrega" value={s.deliveryWeekday} />
              <Field label="Mínimo mayorista">{(id) => <Input id={id} name="min" inputMode="numeric" defaultValue={s.wholesaleMinPacks} />}</Field>
            </div>
            <Field label="WhatsApp del negocio" hint="Con indicativo, ej. 573001234567">
              {(id) => <Input id={id} name="whatsapp" inputMode="tel" defaultValue={s.whatsapp} />}
            </Field>
            <Button type="submit">Guardar</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Productos y precios</CardTitle>
          <div className="flex flex-col gap-4">
            {state.products.map((p) => (
              <form
                key={p.id}
                className="rounded-2xl bg-card-2 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const n = (k: string) => Number(String(f.get(k)).replace(/\D/g, "")) || 0;
                  dispatch({
                    type: "updateProduct",
                    product: { ...p, priceRegular: n("reg"), priceWholesale: n("whl"), unitCost: n("cost"), lowStockThreshold: n("low"), presentation: String(f.get("pres")) },
                  });
                  showToast(`${p.name} actualizado`);
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <ProductArt kind={p.kind} className="size-10" />
                  <div className="flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="tabular text-xs text-tinta-2">
                      Margen mayorista: {money(p.priceWholesale - p.unitCost)} / paq.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Field label="Presentación">{(id) => <Input id={id} name="pres" defaultValue={p.presentation} />}</Field>
                  <Field label="Precio regular">{(id) => <Input id={id} name="reg" inputMode="numeric" defaultValue={p.priceRegular} />}</Field>
                  <Field label="Precio mayorista">{(id) => <Input id={id} name="whl" inputMode="numeric" defaultValue={p.priceWholesale} />}</Field>
                  <Field label="Costo / paq.">{(id) => <Input id={id} name="cost" inputMode="numeric" defaultValue={p.unitCost} />}</Field>
                  <Field label="Stock mínimo">{(id) => <Input id={id} name="low" inputMode="numeric" defaultValue={p.lowStockThreshold} />}</Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="noche" className="w-full">
                      Guardar
                    </Button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Categorías de gasto</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roots.map((r) => {
              const subs = state.categories.filter((c) => c.parentId === r.id);
              return (
                <div key={r.id} className="rounded-2xl bg-card-2 p-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="size-3 rounded-sm" style={{ background: r.color }} /> {r.name}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {subs.map((c) => (
                      <li key={c.id} className="rounded-full bg-card px-2.5 py-1 text-xs">
                        {c.name}
                      </li>
                    ))}
                  </ul>
                  <form
                    className="mt-3 flex gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = (newCat[r.id] ?? "").trim();
                      if (!name) return;
                      dispatch({ type: "addCategory", category: { id: newId("sub"), name, parentId: r.id, isDefault: false } });
                      setNewCat((x) => ({ ...x, [r.id]: "" }));
                    }}
                  >
                    <Input
                      className="!h-9 !rounded-xl text-sm"
                      placeholder="Nueva…"
                      aria-label={`Nueva subcategoría de ${r.name}`}
                      value={newCat[r.id] ?? ""}
                      onChange={(e) => setNewCat((x) => ({ ...x, [r.id]: e.target.value }))}
                    />
                    <button className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-oro text-noche" aria-label="Agregar">
                      <Plus className="size-4" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-dashed lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Datos de prueba</p>
              <p className="text-sm text-tinta-2">Este prototipo guarda los cambios en este navegador. Al conectar Supabase se usan datos reales.</p>
            </div>
            <Button
              variant="borde"
              icon={<RotateCcw className="size-4" />}
              onClick={() => {
                dispatch({ type: "reset" });
                showToast("Datos reiniciados");
              }}
            >
              Reiniciar
            </Button>
          </div>
        </Card>
      </div>
      {toast}
    </>
  );
}

function DaySelect({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <Field label={label}>
      {(id) => (
        <Select id={id} name={name} defaultValue={value}>
          {DIAS.slice(1).map((d, i) => (
            <option key={d} value={i + 1}>
              {d}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
