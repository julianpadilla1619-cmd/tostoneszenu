"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, MessageCircle, Pencil, Phone, Trash2, UserPlus, X } from "lucide-react";
import { createCustomer, deleteCustomer, resetCustomerPassword, setRequestStatus, updateCustomer } from "@/app/actions/admin";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button, Card, Empty, Field, FormError, Input, Pill, Segmented, Select, Sheet, Spinner, Textarea } from "@/components/ui/ui";
import { dayLabel, initials, qty } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { todayBogota } from "@/lib/time";
import type { Profile, SignupRequest } from "@/lib/types";

type Tab = "solicitudes" | "clientes" | "equipo";
type Creds = { name: string; login: string; password: string; phone: string };
type Editor = { mode: "crear"; request?: SignupRequest; role: "mayorista" | "inversionista" } | { mode: "editar"; profile: Profile };

export function ClientesView({
  meId,
  requests,
  customers,
  team,
  municipios,
  siteUrl,
}: {
  meId: string;
  requests: SignupRequest[];
  customers: Profile[];
  team: Profile[];
  municipios: string[];
  siteUrl: string;
}) {
  const [tab, setTab] = useState<Tab>(requests.length ? "solicitudes" : "clientes");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [q, setQ] = useState("");
  const list = (tab === "clientes" ? customers : team).filter(
    (p) => !q.trim() || `${p.fullName} ${p.businessName ?? ""} ${p.phone ?? ""} ${p.municipality ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "solicitudes", label: `Solicitudes${requests.length ? ` (${requests.length})` : ""}` },
            { value: "clientes", label: `Clientes (${customers.length})` },
            { value: "equipo", label: "Equipo" },
          ]}
        />
        <Button className="ml-auto" size="sm" icon={<UserPlus className="size-4" aria-hidden />} onClick={() => setEditor({ mode: "crear", role: tab === "equipo" ? "inversionista" : "mayorista" })}>
          {tab === "equipo" ? "Nuevo inversionista" : "Nuevo cliente"}
        </Button>
      </div>

      {creds && <CredentialsCard creds={creds} siteUrl={siteUrl} onClose={() => setCreds(null)} />}

      {tab === "solicitudes" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {requests.length === 0 && <Empty title="No hay solicitudes nuevas">Cuando alguien llene el formulario de la página principal, aparece aquí y te llega un aviso.</Empty>}
          {requests.map((r) => (
            <Card key={r.id} as="article">
              <p className="font-display text-lg font-bold">{r.businessName ?? r.fullName}</p>
              <p className="text-sm text-tinta-2">
                {r.businessName ? `${r.fullName} · ` : ""}
                {r.municipality ?? ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-2">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" aria-hidden /> {r.phone}
                </span>
                {r.estWeeklyPacks ? <span>~{qty(r.estWeeklyPacks)} paq./semana</span> : null}
                <span>{dayLabel(todayBogota(new Date(r.createdAt)))}</span>
              </div>
              {r.message && <p className="mt-2 rounded-xl bg-card-2 px-3 py-2 text-sm">“{r.message}”</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" icon={<Check className="size-4" aria-hidden />} onClick={() => setEditor({ mode: "crear", request: r, role: "mayorista" })}>
                  Crear cuenta
                </Button>
                <ActionButton variant="peligro" icon={<X className="size-4" aria-hidden />} confirm="¿Rechazar esta solicitud?" action={setRequestStatus.bind(null, r.id, "rechazada")}>
                  Rechazar
                </ActionButton>
                <a
                  href={`https://wa.me/57${r.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto grid size-11 place-items-center rounded-xl bg-ok/15 text-ok"
                  aria-label={`Escribir a ${r.fullName} por WhatsApp`}
                >
                  <MessageCircle className="size-5" aria-hidden />
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, negocio, celular…" aria-label="Buscar" className="mb-3" />
          {list.length === 0 ? (
            <Empty title={tab === "clientes" ? "Todavía no hay clientes" : "Sin resultados"}>
              {tab === "clientes" ? "Crea el primero con el botón “Nuevo cliente” o aprueba una solicitud." : null}
            </Empty>
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-linea">
                {list.map((p) => (
                  <li key={p.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-2 text-sm font-bold text-oro" aria-hidden>
                      {initials(p.businessName ?? p.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.businessName ?? p.fullName}</p>
                      <p className="truncate text-xs text-tinta-2">
                        {p.businessName ? `${p.fullName} · ` : ""}
                        {[p.municipality, p.phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {tab === "equipo" && <Pill className="hidden sm:inline-flex">{ROLE_LABEL[p.role]}</Pill>}
                    <StatusDot status={p.status} />
                    {p.role !== "admin" && (
                      <button onClick={() => setEditor({ mode: "editar", profile: p })} className="grid size-11 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-card-2 hover:text-tinta" aria-label={`Editar ${p.fullName}`}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {editor && (
        <CustomerSheet
          key={editor.mode === "editar" ? editor.profile.id : (editor.request?.id ?? "nuevo")}
          editor={editor}
          meId={meId}
          municipios={municipios}
          onClose={() => setEditor(null)}
          onCreds={(c) => {
            setEditor(null);
            setCreds(c);
            setTab(editor.mode === "crear" && editor.role === "inversionista" ? "equipo" : "clientes");
          }}
        />
      )}
    </>
  );
}

function StatusDot({ status }: { status: Profile["status"] }) {
  const map = { activo: ["bg-ok", "Activo"], pendiente: ["bg-oro", "Pendiente"], inactivo: ["bg-tinta-2", "Inactivo"] } as const;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-tinta-2">
      <span className={"size-2 rounded-full " + map[status][0]} aria-hidden />
      <span className="hidden md:inline">{map[status][1]}</span>
      <span className="sr-only md:hidden">{map[status][1]}</span>
    </span>
  );
}

function CredentialsCard({ creds, siteUrl, onClose }: { creds: Creds; siteUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const msg = `¡Hola ${creds.name.split(" ")[0]}! Ya tienes tu cuenta de Tostones Zenú.\n\nEntra en: ${siteUrl || "la app"}/login\nUsuario: ${creds.login}\nContraseña: ${creds.password}\n\nDesde ahí haces tus pedidos. Te recomendamos cambiar la contraseña en tu perfil.`;
  return (
    <Card className="mb-4 border-oro/50 bg-oro/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">Cuenta lista: {creds.name}</p>
          <p className="mt-1 text-sm text-tinta-2">
            Usuario <b className="text-tinta">{creds.login}</b> · contraseña temporal{" "}
            <b className="tabular rounded bg-noche px-1.5 py-0.5 font-mono text-oro">{creds.password}</b>
          </p>
          <p className="mt-1 text-xs text-tinta-2">Envíasela ahora: por seguridad no se vuelve a mostrar.</p>
        </div>
        <button onClick={onClose} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl hover:bg-card-2" aria-label="Cerrar">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/57${creds.phone}?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#1f9d55] px-4 text-sm font-semibold text-white"
        >
          <MessageCircle className="size-4" aria-hidden /> Enviar por WhatsApp
        </a>
        <Button
          size="sm"
          variant="borde"
          className="h-11"
          icon={<Copy className="size-4" aria-hidden />}
          onClick={async () => {
            await navigator.clipboard.writeText(msg);
            setCopied(true);
          }}
        >
          {copied ? "Copiado" : "Copiar mensaje"}
        </Button>
      </div>
    </Card>
  );
}

function CustomerSheet({
  editor,
  meId,
  municipios,
  onClose,
  onCreds,
}: {
  editor: Editor;
  meId: string;
  municipios: string[];
  onClose: () => void;
  onCreds: (c: Creds) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = editor.mode === "editar" ? editor.profile : null;
  const req = editor.mode === "crear" ? editor.request : undefined;
  const role = editing?.role ?? (editor.mode === "crear" ? editor.role : "mayorista");
  const title = editing ? "Editar cuenta" : role === "inversionista" ? "Nuevo inversionista" : "Nuevo cliente";

  return (
    <Sheet open onClose={onClose} title={title}>
      <form
        className="flex flex-col gap-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          start(async () => {
            if (editing) {
              const r = await updateCustomer(data);
              if (!r.ok) return setError(r.error);
              onClose();
            } else {
              const r = await createCustomer(data);
              if (!r.ok) return setError(r.error);
              const d = r.data as { password: string; phone: string; name: string; login: string };
              onCreds(d);
            }
          });
        }}
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        {req && <input type="hidden" name="request_id" value={req.id} />}
        <input type="hidden" name="role" value={role} />
        <Field label="Nombre de la persona">{(id) => <Input id={id} name="full_name" required maxLength={80} defaultValue={editing?.fullName ?? req?.fullName ?? ""} />}</Field>
        {role === "mayorista" && (
          <Field label="Negocio">{(id) => <Input id={id} name="business_name" maxLength={80} defaultValue={editing?.businessName ?? req?.businessName ?? ""} />}</Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Celular" hint={role === "mayorista" ? "Es su usuario para entrar." : undefined}>
            {(id) => <Input id={id} name="phone" type="tel" inputMode="tel" required defaultValue={editing?.phone ?? req?.phone ?? ""} />}
          </Field>
          <Field label="Municipio">
            {(id) => (
              <Select id={id} name="municipality" defaultValue={editing?.municipality ?? req?.municipality ?? "Tuchín"}>
                {municipios.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label={role === "inversionista" ? "Correo (será su usuario)" : "Correo (opcional)"}>
          {(id) => <Input id={id} name="email" type="email" required={role === "inversionista" && !editing} defaultValue={editing?.email ?? ""} />}
        </Field>
        {role === "mayorista" && <Field label="Dirección de entrega">{(id) => <Input id={id} name="address" maxLength={160} defaultValue={editing?.address ?? ""} />}</Field>}
        {editing && (
          <>
            <Field label="Estado">
              {(id) => (
                <Select id={id} name="status" defaultValue={editing.status}>
                  <option value="activo">Activo (puede entrar y pedir)</option>
                  <option value="inactivo">Inactivo (no puede entrar)</option>
                </Select>
              )}
            </Field>
            <Field label="Notas internas">{(id) => <Textarea id={id} name="notes" rows={2} maxLength={300} defaultValue={editing.notes ?? ""} />}</Field>
          </>
        )}
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending} icon={pending ? <Spinner /> : undefined}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear cuenta"}
        </Button>
        {!editing && <p className="text-xs text-tinta-2">Se genera una contraseña temporal que verás una sola vez para enviársela.</p>}

        {editing && editing.id !== meId && (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-linea pt-4">
            <ActionButton
              icon={<KeyRound className="size-4" aria-hidden />}
              confirm={`¿Generar una contraseña nueva para ${editing.fullName}? La anterior deja de servir.`}
              action={async () => {
                const r = await resetCustomerPassword(editing.id);
                if (r.ok) onCreds({ name: editing.fullName, login: editing.phone ?? editing.email ?? "", password: (r.data as { password: string }).password, phone: editing.phone ?? "" });
                return r;
              }}
            >
              Nueva contraseña
            </ActionButton>
            <ActionButton
              variant="peligro"
              icon={<Trash2 className="size-4" aria-hidden />}
              confirm={`¿Eliminar la cuenta de ${editing.fullName}? Si tiene ventas registradas solo se desactiva.`}
              action={async () => {
                const r = await deleteCustomer(editing.id);
                if (r.ok) onClose();
                return r;
              }}
            >
              Eliminar
            </ActionButton>
          </div>
        )}
      </form>
    </Sheet>
  );
}
