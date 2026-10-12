"use client";

import clsx from "clsx";
import { useState } from "react";
import { CircleCheck, Circle, Clock, Flame, Plus, Truck } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { Button, Card, Field, Input, Select, Sheet } from "@/components/ui/ui";
import { addDays, dayShort, qty, weekdayName, weekRange } from "@/lib/format";
import { TASK_LABEL } from "@/lib/labels";
import { DEMO_TODAY } from "@/lib/mock-data";
import { currentWeek, weekBoard } from "@/lib/selectors";
import { newId, useStore } from "@/lib/store";
import type { TaskKind } from "@/lib/types";

const kindColor: Record<TaskKind, string> = {
  compra: "bg-serie-1",
  produccion: "bg-serie-2",
  empaque: "bg-oro-claro",
  entrega: "bg-serie-3",
  pago: "bg-serie-4",
  otro: "bg-tinta-2",
};

export default function Programacion() {
  const { state, dispatch } = useStore();
  const [adding, setAdding] = useState<string | null>(null);
  const week = currentWeek(state);
  const board = weekBoard(state, week.id);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week.startsOn, i));
  const cutoffDay = addDays(week.startsOn, state.settings.cutoffWeekday - 1);

  return (
    <>
      <PageHead
        title="Programación"
        sub={`Semana ${weekRange(week.startsOn)}`}
        action={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(DEMO_TODAY)}>
            Nueva tarea
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((d) => {
          const tasks = state.tasks.filter((t) => t.day === d);
          const isToday = d === DEMO_TODAY;
          const past = d < DEMO_TODAY;
          return (
            <Card key={d} className={clsx("flex flex-col", isToday && "ring-2 ring-oro", past && "opacity-70")}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-display text-xl font-bold capitalize">{weekdayName(d)}</p>
                <p className="text-xs text-tinta-2">
                  {dayShort(d)}
                  {isToday && <span className="ml-1.5 rounded-full bg-oro px-1.5 py-0.5 font-bold text-noche">Hoy</span>}
                </p>
              </div>

              {d === cutoffDay && (
                <Auto icon={<Clock className="size-4" />} tone="oro">
                  Corte de pedidos {state.settings.cutoffTime}
                </Auto>
              )}
              {d === addDays(cutoffDay, 1) && (
                <Auto icon={<Flame className="size-4" />} tone="fuego">
                  Fritar {board.byProduct.map((b) => `${qty(b.qty)} ${b.product.kind === "toston" ? "tostones" : "papas"}`).join(" · ")}
                </Auto>
              )}
              {d === week.deliveryOn && (
                <Auto icon={<Truck className="size-4" />} tone="entrega">
                  Entregar {board.counts.pidieron} pedidos
                </Auto>
              )}

              <ul className="flex-1 space-y-1">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => dispatch({ type: "toggleTask", id: t.id })} className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl p-2 text-left text-sm hover:bg-card-2">
                      {t.done ? <CircleCheck className="mt-0.5 size-[1.1rem] shrink-0 text-ok" /> : <Circle className="mt-0.5 size-[1.1rem] shrink-0 text-tinta-2" />}
                      <span className="flex-1">
                        <span className={t.done ? "text-tinta-2 line-through" : ""}>{t.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-tinta-2">
                          <span className={clsx("size-2 rounded-full", kindColor[t.kind])} />
                          {TASK_LABEL[t.kind]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button onClick={() => setAdding(d)} className="mt-2 inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-linea text-xs font-semibold text-tinta-2 hover:text-tinta">
                <Plus className="size-3.5" /> Agregar
              </button>
            </Card>
          );
        })}
      </div>

      {adding && (
        <Sheet open onClose={() => setAdding(null)} title="Nueva tarea">
          <form
            className="flex flex-col gap-3 pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              dispatch({
                type: "addTask",
                task: { id: newId("t"), day: String(f.get("day")), kind: f.get("kind") as TaskKind, title: String(f.get("title")), done: false },
              });
              setAdding(null);
            }}
          >
            <Field label="Tarea">{(id) => <Input id={id} name="title" required placeholder="Ej. Recoger empaques" autoFocus />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Día">
                {(id) => (
                  <Select id={id} name="day" defaultValue={adding}>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {dayShort(d)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Tipo">
                {(id) => (
                  <Select id={id} name="kind" defaultValue="otro">
                    {Object.entries(TASK_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Button type="submit" size="lg">
              Guardar
            </Button>
          </form>
        </Sheet>
      )}
    </>
  );
}

function Auto({ icon, children, tone }: { icon: React.ReactNode; children: React.ReactNode; tone: "oro" | "fuego" | "entrega" }) {
  return (
    <div
      className={clsx(
        "mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
        tone === "oro" && "bg-oro/15 text-oro-claro",
        tone === "fuego" && "bg-serie-2/20 text-rojo-claro",
        tone === "entrega" && "bg-serie-3/20 text-[#a9c6ea]",
      )}
    >
      {icon}
      <span className="tabular">{children}</span>
    </div>
  );
}
