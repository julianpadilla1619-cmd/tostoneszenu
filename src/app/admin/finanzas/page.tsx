"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Plus, Scale, Trash2 } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { GroupedBars, HBars } from "@/components/charts/Charts";
import { Button, Card, CardTitle, Field, Input, Pill, Segmented, Select, Sheet, Stat, useToast } from "@/components/ui/ui";
import { dayLabel, dayShort, money, qty } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/labels";
import { DEMO_TODAY } from "@/lib/mock-data";
import { PERIODS, periodRange, type PeriodKey } from "@/lib/periods";
import { finance, rootCategoryOf, weeklySeries } from "@/lib/selectors";
import { newId, useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

export default function Finanzas() {
  const { state, dispatch } = useStore();
  const [toast, showToast] = useToast();
  const [period, setPeriod] = useState<PeriodKey>("mes_pasado");
  const [tab, setTab] = useState<"egresos" | "ingresos">("egresos");
  const [sheet, setSheet] = useState<"gasto" | "ingreso" | null>(null);
  const [catFilter, setCatFilter] = useState<string>("todas");

  const { from, to } = periodRange(period);
  const f = finance(state, from, to);
  const series = weeklySeries(state);
  const roots = state.categories.filter((c) => !c.parentId);

  const expenses = f.expenses
    .filter((e) => catFilter === "todas" || rootCategoryOf(state, e.categoryId)?.id === catFilter)
    .sort((a, b) => b.spentOn.localeCompare(a.spentOn));

  return (
    <>
      <PageHead
        title="Finanzas"
        sub={period === "todo" ? "Todo el historial" : `${dayShort(from)} – ${dayShort(to)}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="suave" icon={<Plus className="size-4" />} onClick={() => setSheet("ingreso")}>
              Ingreso
            </Button>
            <Button size="sm" icon={<Minus className="size-4" />} onClick={() => setSheet("gasto")}>
              Gasto
            </Button>
          </div>
        }
      />

      <Segmented className="mb-4" value={period} onChange={setPeriod} options={PERIODS} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos" value={money(f.income)} sub={`${f.incomes.length} movimientos`} icon={<ArrowUpRight className="size-4" />} />
        <Stat label="Egresos" value={money(f.expense)} sub={`${f.expenses.length} gastos`} icon={<ArrowDownRight className="size-4" />} />
        <Stat
          label="Ganancia neta"
          value={money(f.net)}
          sub="Ingresos − Egresos"
          tone={f.net >= 0 ? "ok" : "mal"}
          icon={<Scale className="size-4" />}
          className="ring-1 ring-oro/30"
        />
        <Stat label="Margen" value={`${Math.round(f.margin)} %`} sub="de cada peso vendido" tone="oro" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Por semana</CardTitle>
          <GroupedBars
            caption="Ingresos y egresos por semana"
            data={series.map((s) => ({ label: dayShort(s.week.startsOn), values: [s.income, s.expense] }))}
            series={[
              { name: "Ingresos", color: "var(--color-serie-1)" },
              { name: "Egresos", color: "var(--color-serie-2)" },
            ]}
          />
        </Card>
        <Card>
          <CardTitle>Egresos por categoría</CardTitle>
          {f.expense === 0 ? (
            <p className="text-sm text-tinta-2">Sin gastos en este periodo.</p>
          ) : (
            <HBars rows={f.byCategory.map((c) => ({ label: c.category.name, value: c.amount, color: c.category.color ?? "var(--color-tinta-2)" }))} />
          )}
          <SubBreakdown from={from} to={to} />
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "egresos", label: `Egresos (${f.expenses.length})` },
              { value: "ingresos", label: `Ingresos (${f.incomes.length})` },
            ]}
          />
          {tab === "egresos" && (
            <Select aria-label="Filtrar por categoría" className="!h-10 !w-auto !rounded-xl text-sm" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {tab === "egresos" ? (
          <ul className="divide-y divide-linea">
            {expenses.map((e) => {
              const sub = state.categories.find((c) => c.id === e.categoryId);
              const root = rootCategoryOf(state, e.categoryId);
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: root?.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.description || sub?.name}</p>
                    <p className="truncate text-xs text-tinta-2">
                      {dayLabel(e.spentOn)} · {root?.name}
                      {sub && sub.id !== root?.id ? ` › ${sub.name}` : ""}
                      {e.quantity ? ` · ${qty(e.quantity)} ${e.unit ?? ""}` : ""}
                      {e.supplier ? ` · ${e.supplier}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-bold text-rojo-claro">−{money(e.amount)}</p>
                    <p className="text-[0.7rem] text-tinta-2">{METHOD_LABEL[e.paymentMethod]}</p>
                  </div>
                  <button onClick={() => dispatch({ type: "removeExpense", id: e.id })} className="grid size-9 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-mal/15 hover:text-mal" aria-label="Eliminar gasto">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
            {expenses.length === 0 && <li className="py-6 text-center text-sm text-tinta-2">Sin gastos.</li>}
          </ul>
        ) : (
          <ul className="divide-y divide-linea">
            {f.incomes.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="h-10 w-1.5 shrink-0 rounded-full bg-serie-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.concept}</p>
                  <p className="text-xs text-tinta-2">
                    {dayLabel(i.receivedOn)} · {METHOD_LABEL[i.paymentMethod]}
                  </p>
                </div>
                {i.orderId ? <Pill className="!py-0.5 text-[0.68rem]">Automático</Pill> : <Pill className="!bg-oro/15 !py-0.5 text-[0.68rem] !text-oro">Manual</Pill>}
                <p className="tabular w-28 text-right text-sm font-bold text-ok">+{money(i.amount)}</p>
                {!i.orderId ? (
                  <button onClick={() => dispatch({ type: "removeIncome", id: i.id })} className="grid size-9 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-mal/15 hover:text-mal" aria-label="Eliminar ingreso">
                    <Trash2 className="size-4" />
                  </button>
                ) : (
                  <span className="size-9" />
                )}
              </li>
            ))}
            {f.incomes.length === 0 && <li className="py-6 text-center text-sm text-tinta-2">Sin ingresos.</li>}
          </ul>
        )}
      </Card>

      {sheet === "gasto" && (
        <ExpenseSheet
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null);
            showToast("Gasto registrado");
          }}
        />
      )}
      {sheet === "ingreso" && (
        <Sheet open onClose={() => setSheet(null)} title="Registrar ingreso">
          <form
            className="flex flex-col gap-3 pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              dispatch({
                type: "addIncome",
                income: {
                  id: newId("i"),
                  receivedOn: String(fd.get("date")),
                  concept: String(fd.get("concept")),
                  amount: Number(String(fd.get("amount")).replace(/\D/g, "")),
                  paymentMethod: fd.get("method") as PaymentMethod,
                },
              });
              setSheet(null);
              showToast("Ingreso registrado");
            }}
          >
            <p className="rounded-xl bg-card px-3 py-2 text-xs text-tinta-2">Los pedidos entregados y pagados se suman solos. Aquí van ventas sueltas, ferias, etc.</p>
            <Field label="Concepto">{(id) => <Input id={id} name="concept" required placeholder="Ej. Venta de mostrador" />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto">{(id) => <Input id={id} name="amount" inputMode="numeric" required placeholder="$ 0" />}</Field>
              <Field label="Fecha">{(id) => <Input id={id} name="date" type="date" defaultValue={DEMO_TODAY} required />}</Field>
            </div>
            <MethodSelect />
            <Button type="submit" size="lg">
              Guardar ingreso
            </Button>
          </form>
        </Sheet>
      )}
      {toast}
    </>
  );
}

function SubBreakdown({ from, to }: { from: string; to: string }) {
  const { state } = useStore();
  const subs = state.categories
    .filter((c) => c.parentId)
    .map((c) => ({ c, amount: state.expenses.filter((e) => e.categoryId === c.id && e.spentOn >= from && e.spentOn <= to).reduce((a, e) => a + e.amount, 0) }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  if (!subs.length) return null;
  return (
    <details className="mt-4 border-t border-linea pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-acento">Ver detalle por subcategoría</summary>
      <ul className="tabular mt-2 space-y-1 text-sm">
        {subs.map(({ c, amount }) => (
          <li key={c.id} className="flex justify-between">
            <span className="text-tinta-2">{c.name}</span>
            <span>{money(amount)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function MethodSelect() {
  return (
    <Field label="Método de pago">
      {(id) => (
        <Select id={id} name="method" defaultValue="efectivo">
          {Object.entries(METHOD_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function ExpenseSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { state, dispatch } = useStore();
  const roots = state.categories.filter((c) => !c.parentId);
  const [root, setRoot] = useState(roots[0]?.id ?? "");
  const subs = state.categories.filter((c) => c.parentId === root);
  const [sub, setSub] = useState(subs[0]?.id ?? "");
  const [newSub, setNewSub] = useState("");

  return (
    <Sheet open onClose={onClose} title="Registrar gasto">
      <form
        className="flex flex-col gap-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          let categoryId = sub || root;
          if (sub === "__nueva" && newSub.trim()) {
            categoryId = newId("sub");
            dispatch({ type: "addCategory", category: { id: categoryId, name: newSub.trim(), parentId: root, isDefault: false } });
          }
          const amount = Number(String(fd.get("amount")).replace(/\D/g, ""));
          if (!amount) return;
          dispatch({
            type: "addExpense",
            expense: {
              id: newId("e"),
              spentOn: String(fd.get("date")),
              categoryId,
              description: String(fd.get("description") ?? "").trim(),
              quantity: Number(fd.get("quantity")) || undefined,
              unit: String(fd.get("unit") ?? "").trim() || undefined,
              amount,
              paymentMethod: fd.get("method") as PaymentMethod,
              supplier: String(fd.get("supplier") ?? "").trim() || undefined,
            },
          });
          onSaved();
        }}
      >
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Categoría">
          {roots.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={root === r.id}
              onClick={() => {
                setRoot(r.id);
                setSub(state.categories.find((c) => c.parentId === r.id)?.id ?? "");
              }}
              className={"flex h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-left text-sm font-semibold transition " + (root === r.id ? "border-oro bg-oro/10" : "border-linea")}
            >
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: r.color }} />
              {r.name}
            </button>
          ))}
        </div>
        <Field label="Subcategoría">
          {(id) => (
            <Select id={id} value={sub} onChange={(e) => setSub(e.target.value)}>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__nueva">+ Nueva subcategoría…</option>
            </Select>
          )}
        </Field>
        {sub === "__nueva" && <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nombre (ej. Bolsas de basura)" aria-label="Nueva subcategoría" required />}
        <Field label="Descripción">{(id) => <Input id={id} name="description" placeholder="Ej. Racimos de plátano hartón" />}</Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cantidad">{(id) => <Input id={id} name="quantity" inputMode="decimal" placeholder="12" />}</Field>
          <Field label="Unidad">{(id) => <Input id={id} name="unit" placeholder="racimo" list="unidades" />}</Field>
          <Field label="Monto">{(id) => <Input id={id} name="amount" inputMode="numeric" required placeholder="$ 0" />}</Field>
        </div>
        <datalist id="unidades">
          {["racimo", "bulto", "kg", "bidón", "galón", "cilindro", "und", "jornal", "ruta"].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">{(id) => <Input id={id} name="date" type="date" defaultValue={DEMO_TODAY} required />}</Field>
          <MethodSelect />
        </div>
        <Field label="Proveedor (opcional)">{(id) => <Input id={id} name="supplier" placeholder="Ej. Finca Los Mangos" />}</Field>
        <Button type="submit" size="lg">
          Guardar gasto
        </Button>
      </form>
    </Sheet>
  );
}
