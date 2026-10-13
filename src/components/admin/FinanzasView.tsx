"use client";

import { useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Plus, Scale, Trash2 } from "lucide-react";
import { addExpense, addIncome, deleteRow } from "@/app/actions/admin";
import { PageHead } from "@/components/admin/AdminShell";
import { GroupedBars, HBars } from "@/components/charts/Charts";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button, Card, CardTitle, Field, FormError, Input, Pill, Segmented, Select, Sheet, Spinner, Stat, useToast } from "@/components/ui/ui";
import { dayLabel, dayShort, money, qty } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/labels";
import { PERIODS, periodRange, type PeriodKey } from "@/lib/periods";
import { finance, rootCategoryOf, weeklySeries } from "@/lib/selectors";
import { mondayOf } from "@/lib/time";
import type { ActionResult, Expense, ExpenseCategory, Income } from "@/lib/types";

export function FinanzasView({ today, incomes, expenses, categories }: { today: string; incomes: Income[]; expenses: Expense[]; categories: ExpenseCategory[] }) {
  const [period, setPeriod] = useState<PeriodKey>("mes");
  const [tab, setTab] = useState<"gastos" | "ingresos">("gastos");
  const [sheet, setSheet] = useState<"gasto" | "ingreso" | null>(null);
  const [catFilter, setCatFilter] = useState("todas");
  const { from, to } = periodRange(period, today);
  const f = finance(incomes, expenses, categories, from, to);
  const series = weeklySeries(incomes, expenses, mondayOf(today), 8);
  const roots = categories.filter((c) => !c.parentId);
  const shownExpenses = f.expenses.filter((e) => catFilter === "todas" || rootCategoryOf(categories, e.categoryId)?.id === catFilter);

  return (
    <>
      <PageHead
        title="Finanzas"
        sub={`${dayShort(from)} – ${dayShort(to)}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="suave" icon={<Plus className="size-4" aria-hidden />} onClick={() => setSheet("ingreso")}>
              Ingreso
            </Button>
            <Button size="sm" icon={<Minus className="size-4" aria-hidden />} onClick={() => setSheet("gasto")}>
              Gasto
            </Button>
          </div>
        }
      />
      <Segmented className="mb-4" value={period} onChange={setPeriod} options={PERIODS} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos" value={money(f.income)} sub={`${f.incomes.length} movimientos`} icon={<ArrowUpRight className="size-4" aria-hidden />} />
        <Stat label="Gastos" value={money(f.expense)} sub={`${f.expenses.length} registros`} icon={<ArrowDownRight className="size-4" aria-hidden />} />
        <Stat label="Ganancia neta" value={money(f.net)} sub="Ingresos − gastos" tone={f.net >= 0 ? "ok" : "mal"} icon={<Scale className="size-4" aria-hidden />} className="ring-1 ring-oro/30" />
        <Stat label="Margen" value={`${Math.round(f.margin)} %`} sub="de cada peso vendido" tone="oro" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Últimas 8 semanas</CardTitle>
          <GroupedBars
            caption="Ingresos y gastos por semana"
            data={series.map((s) => ({ label: dayShort(s.from), values: [s.income, s.expense] }))}
            series={[
              { name: "Ingresos", color: "var(--color-serie-1)" },
              { name: "Gastos", color: "var(--color-serie-2)" },
            ]}
          />
        </Card>
        <Card>
          <CardTitle>Gastos por categoría</CardTitle>
          {f.expense === 0 ? (
            <p className="text-sm text-tinta-2">Sin gastos en este periodo.</p>
          ) : (
            <HBars rows={f.byCategory.filter((c) => c.amount > 0).map((c) => ({ label: c.category.name, value: c.amount, color: c.category.color ?? "var(--color-tinta-2)" }))} />
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "gastos", label: `Gastos (${f.expenses.length})` },
              { value: "ingresos", label: `Ingresos (${f.incomes.length})` },
            ]}
          />
          {tab === "gastos" && (
            <Select aria-label="Filtrar por categoría" className="!h-11 !w-auto !rounded-xl text-sm" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        {tab === "gastos" ? (
          <ul className="divide-y divide-linea">
            {shownExpenses.map((e) => {
              const sub = categories.find((c) => c.id === e.categoryId);
              const root = rootCategoryOf(categories, e.categoryId);
              return (
                <li key={e.id} className="flex min-h-14 items-center gap-3 py-2.5">
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: root?.color ?? undefined }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.description || sub?.name}</p>
                    <p className="truncate text-xs text-tinta-2">
                      {dayLabel(e.spentOn)} · {root?.name}
                      {sub && sub.id !== root?.id ? ` › ${sub.name}` : ""}
                      {e.quantity ? ` · ${qty(e.quantity)} ${e.unit ?? ""}` : ""}
                      {e.supplier ? ` · ${e.supplier}` : ""}
                    </p>
                  </div>
                  <p className="tabular text-right text-sm font-bold text-rojo-claro">
                    −{money(e.amount)}
                    <span className="block text-[0.7rem] font-normal text-tinta-2">{METHOD_LABEL[e.paymentMethod]}</span>
                  </p>
                  <ActionButton variant="fantasma" confirm="¿Eliminar este gasto?" action={deleteRow.bind(null, "expenses", e.id)} icon={<Trash2 className="size-4" aria-hidden />}>
                    <span className="sr-only">Eliminar gasto</span>
                  </ActionButton>
                </li>
              );
            })}
            {shownExpenses.length === 0 && <li className="py-6 text-center text-sm text-tinta-2">Sin gastos en este periodo.</li>}
          </ul>
        ) : (
          <ul className="divide-y divide-linea">
            {f.incomes.map((i) => (
              <li key={i.id} className="flex min-h-14 items-center gap-3 py-2.5">
                <span className="h-10 w-1.5 shrink-0 rounded-full bg-serie-1" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.concept}</p>
                  <p className="text-xs text-tinta-2">
                    {dayLabel(i.receivedOn)} · {METHOD_LABEL[i.paymentMethod]}
                  </p>
                </div>
                <Pill className="hidden !py-0.5 text-[0.68rem] sm:inline-flex">{i.orderId ? "Pedido" : "Manual"}</Pill>
                <p className="tabular text-right text-sm font-bold text-ok">+{money(i.amount)}</p>
                {i.orderId ? (
                  <span className="size-9" aria-hidden />
                ) : (
                  <ActionButton variant="fantasma" confirm="¿Eliminar este ingreso?" action={deleteRow.bind(null, "incomes", i.id)} icon={<Trash2 className="size-4" aria-hidden />}>
                    <span className="sr-only">Eliminar ingreso</span>
                  </ActionButton>
                )}
              </li>
            ))}
            {f.incomes.length === 0 && <li className="py-6 text-center text-sm text-tinta-2">Sin ingresos en este periodo. Los pedidos entregados y pagados se suman solos.</li>}
          </ul>
        )}
      </Card>

      {sheet === "gasto" && <ExpenseSheet today={today} categories={categories} onClose={() => setSheet(null)} />}
      {sheet === "ingreso" && <IncomeSheet today={today} onClose={() => setSheet(null)} />}
    </>
  );
}

function useSubmit(action: (d: FormData) => Promise<ActionResult<unknown>>, onDone: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const r = await action(data);
      if (!r.ok) return setError(r.error);
      showToast(r.message ?? "Guardado");
      onDone();
    });
  };
  return { pending, error, onSubmit, toast };
}

function MethodSelect() {
  return (
    <Field label="Cómo se pagó">
      {(id) => (
        <Select id={id} name="payment_method" defaultValue="efectivo">
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

function IncomeSheet({ today, onClose }: { today: string; onClose: () => void }) {
  const { pending, error, onSubmit, toast } = useSubmit(addIncome, onClose);
  return (
    <Sheet open onClose={onClose} title="Registrar ingreso">
      <form className="flex flex-col gap-3 pb-4" onSubmit={onSubmit}>
        <p className="rounded-xl bg-card px-3 py-2 text-xs text-tinta-2">Los pedidos entregados y pagados se suman solos. Aquí van ventas sueltas u otros ingresos.</p>
        <Field label="Concepto">{(id) => <Input id={id} name="concept" required maxLength={120} placeholder="Ej. Venta en feria" />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto">{(id) => <Input id={id} name="amount" type="number" inputMode="numeric" min={1} required />}</Field>
          <Field label="Fecha">{(id) => <Input id={id} name="received_on" type="date" defaultValue={today} required />}</Field>
        </div>
        <MethodSelect />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : undefined}>
          Guardar ingreso
        </Button>
      </form>
      {toast}
    </Sheet>
  );
}

function ExpenseSheet({ today, categories, onClose }: { today: string; categories: ExpenseCategory[]; onClose: () => void }) {
  const { pending, error, onSubmit, toast } = useSubmit(addExpense, onClose);
  const roots = categories.filter((c) => !c.parentId);
  const [root, setRoot] = useState(roots[0]?.id ?? "");
  const subs = categories.filter((c) => c.parentId === root);
  const [sub, setSub] = useState(subs[0]?.id ?? "");
  return (
    <Sheet open onClose={onClose} title="Registrar gasto">
      <form className="flex flex-col gap-3 pb-4" onSubmit={onSubmit}>
        <input type="hidden" name="parent_id" value={root} />
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Categoría</legend>
          <div className="grid grid-cols-2 gap-2">
            {roots.map((r) => (
              <label key={r.id} className={"flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition " + (root === r.id ? "border-oro bg-oro/10" : "border-linea")}>
                <input
                  type="radio"
                  name="root_pick"
                  className="sr-only"
                  checked={root === r.id}
                  onChange={() => {
                    setRoot(r.id);
                    setSub(categories.find((c) => c.parentId === r.id)?.id ?? "__nueva");
                  }}
                />
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: r.color ?? undefined }} aria-hidden />
                {r.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Subcategoría">
          {(id) => (
            <Select id={id} name="category_id" value={sub} onChange={(e) => setSub(e.target.value)}>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__nueva">+ Nueva subcategoría…</option>
            </Select>
          )}
        </Field>
        {sub === "__nueva" && <Field label="Nombre de la subcategoría">{(id) => <Input id={id} name="new_subcategory" required maxLength={40} />}</Field>}
        <Field label="Descripción">{(id) => <Input id={id} name="description" maxLength={160} placeholder="Ej. Racimos de plátano hartón" />}</Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cantidad">{(id) => <Input id={id} name="quantity" inputMode="decimal" placeholder="12" />}</Field>
          <Field label="Unidad">{(id) => <Input id={id} name="unit" list="unidades" maxLength={20} placeholder="racimo" />}</Field>
          <Field label="Monto">{(id) => <Input id={id} name="amount" type="number" inputMode="numeric" min={1} required />}</Field>
        </div>
        <datalist id="unidades">
          {["racimo", "bulto", "kg", "bidón", "galón", "cilindro", "unidad", "jornal", "viaje"].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">{(id) => <Input id={id} name="spent_on" type="date" defaultValue={today} required />}</Field>
          <MethodSelect />
        </div>
        <Field label="Proveedor (opcional)">{(id) => <Input id={id} name="supplier" maxLength={80} />}</Field>
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : undefined}>
          Guardar gasto
        </Button>
      </form>
      {toast}
    </Sheet>
  );
}
