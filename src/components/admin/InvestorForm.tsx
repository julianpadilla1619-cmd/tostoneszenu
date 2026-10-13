"use client";

import { useState, useTransition } from "react";
import { saveInvestor } from "@/app/actions/admin";
import { Button, Field, FormError, Input, Select, Spinner, useToast } from "@/components/ui/ui";
import type { Investor } from "@/lib/types";

export function InvestorForm({ investors, accounts }: { investors: Investor[]; accounts: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<string>(investors[0]?.id ?? "nuevo");
  const inv = investors.find((i) => i.id === selected);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  return (
    <form
      key={selected}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          const r = await saveInvestor(data);
          if (!r.ok) return setError(r.error);
          setError(null);
          showToast(r.message ?? "Guardado");
        });
      }}
    >
      <Select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Inversionista">
        {investors.map((i) => (
          <option key={i.id} value={i.id}>
            Editar: {i.name}
          </option>
        ))}
        <option value="nuevo">+ Agregar inversionista</option>
      </Select>
      {inv && <input type="hidden" name="id" value={inv.id} />}
      <Field label="Nombre">{(id) => <Input id={id} name="name" required maxLength={80} defaultValue={inv?.name ?? ""} />}</Field>
      <Field label="Porcentaje de la ganancia" hint="Entre 1 y 100.">
        {(id) => <Input id={id} name="percentage" type="number" inputMode="decimal" min={1} max={100} step="0.5" required defaultValue={inv?.percentage ?? 30} />}
      </Field>
      <Field label="Cuenta para ver sus ganancias (opcional)">
        {(id) => (
          <Select id={id} name="profile_id" defaultValue={inv?.profileId ?? ""}>
            <option value="">Sin cuenta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <FormError message={error} />
      <Button type="submit" disabled={pending} icon={pending ? <Spinner /> : undefined}>
        {inv ? "Guardar cambios" : "Agregar"}
      </Button>
      {toast}
    </form>
  );
}
