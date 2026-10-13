import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { toProfile } from "./mappers";
import { createClient } from "./supabase/server";
import type { Profile, Role } from "./types";

/** Perfil del usuario con sesión (una sola consulta por request). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  // La sesión (y la hora con la que se valida) son de cada petición: nunca se prerenderizan.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ? toProfile(data) : null;
});

/** Para páginas: redirige a /login si no hay sesión activa con uno de esos roles. */
export async function requirePage(roles: Role[]): Promise<Profile> {
  const p = await getProfile();
  if (!p || p.status !== "activo" || !roles.includes(p.role)) redirect("/login");
  return p;
}

export class AuthError extends Error {}

/** Para Server Actions: lanza si el usuario no tiene permiso (nunca confiar en el cliente). */
export async function requireAction(roles: Role[]): Promise<Profile> {
  const p = await getProfile();
  if (!p || p.status !== "activo" || !roles.includes(p.role)) throw new AuthError("No tienes permiso para hacer esto.");
  return p;
}

export function homeFor(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "inversionista") return "/inversor";
  return "/app";
}

/** Celular colombiano → correo interno con el que se crea la cuenta en Supabase Auth. */
export function phoneToAuthEmail(phone: string) {
  return `57${phone.replace(/\D/g, "").slice(-10)}@clientes.tostoneszenu.app`;
}
