"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { addTask } from "@/app/actions/admin";
import { Button, Field, FormError, Input, Select, Sheet, Spinner } from "@/components/ui/ui";
import { dayLabel } from "@/lib/format";
import { TASK_LABEL } from "@/lib/labels";

export function TaskForm({ days, today }: { days: string[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
        Nueva tarea
      </Button>
      {open && (
        <Sheet open onClose={() => setOpen(false)} title="Nueva tarea">
          <form
            className="flex flex-col gap-3 pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              start(async () => {
                const r = await addTask(data);
                if (!r.ok) return setError(r.error);
                setOpen(false);
              });
            }}
          >
            <Field label="Tarea">{(id) => <Input id={id} name="title" required maxLength={120} placeholder="Ej. Recoger empaques" />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Día">
                {(id) => (
                  <Select id={id} name="day" defaultValue={days.includes(today) ? today : days[0]}>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {dayLabel(d)}
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
            <FormError message={error} />
            <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : undefined}>
              Guardar
            </Button>
          </form>
        </Sheet>
      )}
    </>
  );
}
