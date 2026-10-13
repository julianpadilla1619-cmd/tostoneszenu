"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { addCategory, deleteFaq, saveFaq, saveSettings } from "@/app/actions/admin";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button, Card, CardTitle, Field, FormError, Input, Sheet, Spinner, Switch, Textarea, useToast } from "@/components/ui/ui";
import { WEEKDAY_NAMES } from "@/lib/time";
import type { ActionResult, ExpenseCategory, Faq, Settings } from "@/lib/types";

function useForm(action: (d: FormData) => Promise<ActionResult<unknown>>, after?: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const r = await action(data);
      if (!r.ok) return setError(r.error);
      setError(null);
      showToast(r.message ?? "Guardado");
      after?.();
    });
  };
  return { pending, error, onSubmit, toast };
}

export function AjustesView({ settings, faqs, categories }: { settings: Settings; faqs: Faq[]; categories: ExpenseCategory[] }) {
  const s = useForm(saveSettings);
  const [faq, setFaq] = useState<Faq | "nueva" | null>(null);
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle>Entregas y pedidos</CardTitle>
        <form className="flex flex-col gap-4" onSubmit={s.onSubmit}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Días de entrega</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKDAY_NAMES.slice(1).map((d, i) => (
                <label key={d} className="relative">
                  <input type="checkbox" name="delivery_weekdays" value={i + 1} defaultChecked={settings.deliveryWeekdays.includes(i + 1)} className="peer sr-only" />
                  <span className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-linea text-sm font-semibold text-tinta-2 transition peer-checked:border-oro peer-checked:bg-oro peer-checked:text-noche peer-focus-visible:ring-2 peer-focus-visible:ring-oro">
                    {d.slice(0, 3)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora límite" hint="Del día anterior a cada entrega.">
              {(id) => <Input id={id} name="cutoff_time" type="time" defaultValue={settings.cutoffTime} required />}
            </Field>
            <Field label="Pedido mínimo" hint="Paquetes por pedido.">
              {(id) => <Input id={id} name="wholesale_min_packs" type="number" inputMode="numeric" min={1} defaultValue={settings.wholesaleMinPacks} required />}
            </Field>
          </div>
          <input type="hidden" name="reminder_weekday" value={settings.reminderWeekday} />
          <input type="hidden" name="reminder_time" value={settings.reminderTime} />
          <Field label="WhatsApp del negocio" hint="Con 57 adelante, ej. 573001234567. Aparece como botón en la página.">
            {(id) => <Input id={id} name="whatsapp" type="tel" inputMode="tel" defaultValue={settings.whatsapp ?? ""} placeholder="573001234567" />}
          </Field>
          <Field label="Correo de contacto (opcional)">{(id) => <Input id={id} name="contact_email" type="email" defaultValue={settings.contactEmail ?? ""} />}</Field>
          <Field label="Titular de la página principal">{(id) => <Input id={id} name="headline" required maxLength={120} defaultValue={settings.headline} />}</Field>
          <Field label="Zonas de entrega">{(id) => <Textarea id={id} name="zones" rows={2} required maxLength={240} defaultValue={settings.zones} />}</Field>
          <FormError message={s.error} />
          <Button type="submit" disabled={s.pending} icon={s.pending ? <Spinner /> : undefined}>
            {s.pending ? "Guardando…" : "Guardar ajustes"}
          </Button>
          <p className="text-xs text-tinta-2">El recordatorio automático sale el día antes de cada entrega a las 10 a. m. a quien no haya pedido.</p>
        </form>
        {s.toast}
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle
            action={
              <Button size="sm" variant="suave" icon={<Plus className="size-4" aria-hidden />} onClick={() => setFaq("nueva")}>
                Agregar
              </Button>
            }
          >
            Preguntas frecuentes
          </CardTitle>
          <ul className="divide-y divide-linea">
            {faqs.map((f) => (
              <li key={f.id} className="flex min-h-14 items-start gap-3 py-2.5">
                <div className={"min-w-0 flex-1 " + (f.active ? "" : "opacity-50")}>
                  <p className="text-sm font-semibold">{f.question}</p>
                  <p className="line-clamp-2 text-xs text-tinta-2">{f.answer}</p>
                </div>
                <button onClick={() => setFaq(f)} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-card-2" aria-label={`Editar pregunta: ${f.question}`}>
                  <Pencil className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Categorías de gasto</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {roots.map((r) => (
              <CategoryBox key={r.id} root={r} subs={categories.filter((c) => c.parentId === r.id)} />
            ))}
          </div>
        </Card>
      </div>

      {faq && <FaqSheet faq={faq === "nueva" ? null : faq} onClose={() => setFaq(null)} />}
    </div>
  );
}

function CategoryBox({ root, subs }: { root: ExpenseCategory; subs: ExpenseCategory[] }) {
  const [name, setName] = useState("");
  const f = useForm(addCategory, () => setName(""));
  return (
    <div className="rounded-2xl bg-card-2 p-3">
      <p className="flex items-center gap-2 font-semibold">
        <span className="size-3 rounded-sm" style={{ background: root.color ?? undefined }} aria-hidden /> {root.name}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {subs.map((c) => (
          <li key={c.id} className="rounded-full bg-card px-2.5 py-1 text-xs">
            {c.name}
          </li>
        ))}
      </ul>
      <form className="mt-3 flex gap-1.5" onSubmit={f.onSubmit}>
        <input type="hidden" name="parent_id" value={root.id} />
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} className="!h-11 !rounded-xl" placeholder="Nueva subcategoría" aria-label={`Nueva subcategoría de ${root.name}`} maxLength={40} required />
        <button className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-oro text-noche" aria-label="Agregar" disabled={f.pending}>
          {f.pending ? <Spinner /> : <Plus className="size-4" aria-hidden />}
        </button>
      </form>
      <FormError message={f.error} />
    </div>
  );
}

function FaqSheet({ faq, onClose }: { faq: Faq | null; onClose: () => void }) {
  const f = useForm(saveFaq, onClose);
  return (
    <Sheet open onClose={onClose} title={faq ? "Editar pregunta" : "Nueva pregunta"}>
      <form className="flex flex-col gap-3 pb-4" onSubmit={f.onSubmit}>
        {faq && <input type="hidden" name="id" value={faq.id} />}
        <Field label="Pregunta">{(id) => <Input id={id} name="question" required maxLength={160} defaultValue={faq?.question ?? ""} />}</Field>
        <Field label="Respuesta">{(id) => <Textarea id={id} name="answer" rows={4} required maxLength={600} defaultValue={faq?.answer ?? ""} />}</Field>
        <Field label="Orden">{(id) => <Input id={id} name="sort" type="number" inputMode="numeric" min={0} defaultValue={faq?.sort ?? 10} />}</Field>
        <Switch name="active" defaultChecked={faq?.active ?? true} label="Visible en la página" />
        <FormError message={f.error} />
        <Button type="submit" size="lg" disabled={f.pending} icon={f.pending ? <Spinner /> : undefined}>
          Guardar
        </Button>
        {faq && (
          <ActionButton
            variant="fantasma"
            icon={<Trash2 className="size-4" aria-hidden />}
            confirm="¿Eliminar esta pregunta?"
            action={async () => {
              const r = await deleteFaq(faq.id);
              if (r.ok) onClose();
              return r;
            }}
          >
            Eliminar
          </ActionButton>
        )}
      </form>
    </Sheet>
  );
}
