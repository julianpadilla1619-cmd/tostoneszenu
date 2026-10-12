"use client";

import { useState } from "react";
import { Check, MessageCircle, Pencil, Phone, Trash2, X } from "lucide-react";
import { PageHead } from "@/components/admin/AdminShell";
import { Button, Card, Empty, Field, Input, Pill, Segmented, Select, Sheet, useToast } from "@/components/ui/ui";
import { dayLabel, initials, qty } from "@/lib/format";
import { MUNICIPIOS, ROLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Profile, Role, UserStatus } from "@/lib/types";

type Tab = "solicitudes" | "clientes" | "equipo";

export default function Usuarios() {
  const { state, dispatch } = useStore();
  const [toast, showToast] = useToast();
  const newReq = state.requests.filter((r) => r.status === "nueva");
  const [tab, setTab] = useState<Tab>(newReq.length ? "solicitudes" : "clientes");
  const [editing, setEditing] = useState<Profile | null>(null);

  const clients = state.profiles.filter((p) => p.role === "mayorista" || p.role === "regular");
  const team = state.profiles.filter((p) => p.role === "admin" || p.role === "inversionista");

  return (
    <>
      <PageHead title="Usuarios" sub={`${clients.filter((c) => c.status === "activo").length} clientes activos`} />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: "solicitudes", label: `Solicitudes${newReq.length ? ` (${newReq.length})` : ""}` },
          { value: "clientes", label: `Clientes (${clients.length})` },
          { value: "equipo", label: "Equipo" },
        ]}
      />

      {tab === "solicitudes" && (
        <div className="grid gap-3 md:grid-cols-2">
          {newReq.length === 0 && <Empty title="No hay solicitudes nuevas">Cuando alguien llene el formulario de la página, aparece aquí.</Empty>}
          {newReq.map((r) => (
            <Card key={r.id} as="article">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold">{r.businessName ?? r.fullName}</p>
                  <p className="text-sm text-tinta-2">
                    {r.businessName ? `${r.fullName} · ` : ""}
                    {r.municipality}
                  </p>
                </div>
                <Pill className={r.requestedRole === "mayorista" ? "!bg-oro !text-noche" : ""}>{ROLE_LABEL[r.requestedRole]}</Pill>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-2">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {r.phone}
                </span>
                {r.estWeeklyPacks && <span>~{qty(r.estWeeklyPacks)} paq./semana</span>}
                <span>{dayLabel(r.createdAt)}</span>
              </div>
              {r.message && <p className="mt-2 rounded-xl bg-card-2 px-3 py-2 text-sm">“{r.message}”</p>}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  icon={<Check className="size-4" />}
                  onClick={() => {
                    dispatch({ type: "resolveRequest", id: r.id, approve: true });
                    showToast(`${r.fullName} ya puede pedir`);
                  }}
                >
                  Aprobar
                </Button>
                <Button size="sm" variant="peligro" icon={<X className="size-4" />} onClick={() => dispatch({ type: "resolveRequest", id: r.id, approve: false })}>
                  Rechazar
                </Button>
                <a
                  href={`https://wa.me/57${r.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto grid size-9 place-items-center rounded-xl bg-card-2 text-ok"
                  aria-label={`Escribir a ${r.fullName} por WhatsApp`}
                >
                  <MessageCircle className="size-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab !== "solicitudes" && (
        <Card className="p-0">
          <ul className="divide-y divide-linea">
            {(tab === "clientes" ? clients : team).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-2 text-sm font-bold text-oro">{initials(p.businessName ?? p.fullName)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.businessName ?? p.fullName}</p>
                  <p className="truncate text-xs text-tinta-2">
                    {p.businessName ? `${p.fullName} · ` : ""}
                    {p.municipality} · {p.phone}
                  </p>
                </div>
                <Pill className="hidden sm:inline-flex">{ROLE_LABEL[p.role]}</Pill>
                <StatusDot status={p.status} />
                <button onClick={() => setEditing(p)} className="grid size-9 cursor-pointer place-items-center rounded-xl text-tinta-2 hover:bg-card-2 hover:text-tinta" aria-label={`Editar ${p.fullName}`}>
                  <Pencil className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {editing && (
        <UserSheet
          key={editing.id}
          profile={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            dispatch({ type: "updateProfile", profile: p });
            setEditing(null);
            showToast("Usuario actualizado");
          }}
          onDelete={() => {
            dispatch({ type: "removeProfile", id: editing.id });
            setEditing(null);
            showToast("Usuario eliminado");
          }}
        />
      )}
      {toast}
    </>
  );
}

function StatusDot({ status }: { status: UserStatus }) {
  const map = { activo: ["bg-ok", "Activo"], pendiente: ["bg-oro", "Pendiente"], inactivo: ["bg-tinta-2", "Inactivo"] } as const;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-tinta-2">
      <span className={"size-2 rounded-full " + map[status][0]} />
      <span className="hidden md:inline">{map[status][1]}</span>
    </span>
  );
}

function UserSheet({ profile, onClose, onSave, onDelete }: { profile: Profile; onClose: () => void; onSave: (p: Profile) => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Sheet open onClose={onClose} title="Editar usuario">
      <form
        className="flex flex-col gap-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSave({
            ...profile,
            fullName: String(f.get("fullName")),
            businessName: String(f.get("businessName") ?? "").trim() || undefined,
            phone: String(f.get("phone")).replace(/\D/g, ""),
            role: f.get("role") as Role,
            status: f.get("status") as UserStatus,
            municipality: String(f.get("municipality")),
            address: String(f.get("address") ?? "").trim() || undefined,
          });
        }}
      >
        <Field label="Nombre">{(id) => <Input id={id} name="fullName" defaultValue={profile.fullName} required />}</Field>
        <Field label="Negocio">{(id) => <Input id={id} name="businessName" defaultValue={profile.businessName} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Celular">{(id) => <Input id={id} name="phone" defaultValue={profile.phone} inputMode="tel" required />}</Field>
          <Field label="Municipio">
            {(id) => (
              <Select id={id} name="municipality" defaultValue={profile.municipality}>
                {MUNICIPIOS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Dirección de entrega">{(id) => <Input id={id} name="address" defaultValue={profile.address} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rol">
            {(id) => (
              <Select id={id} name="role" defaultValue={profile.role}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Estado">
            {(id) => (
              <Select id={id} name="status" defaultValue={profile.status}>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            )}
          </Field>
        </div>
        <Button type="submit" size="lg">
          Guardar cambios
        </Button>
        {profile.role !== "admin" &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 rounded-2xl bg-mal/10 p-3 text-sm">
              <span className="flex-1 text-rojo-claro">¿Eliminar a {profile.fullName} y sus pedidos? No se puede deshacer.</span>
              <Button type="button" size="sm" variant="peligro" onClick={onDelete}>
                Sí, eliminar
              </Button>
            </div>
          ) : (
            <Button type="button" variant="fantasma" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
              Eliminar usuario
            </Button>
          ))}
      </form>
    </Sheet>
  );
}
