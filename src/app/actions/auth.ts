"use server";

import { redirect } from "next/navigation";
import { getProfile, homeFor, phoneToAuthEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type AuthState = { error?: string; message?: string; identifier?: string } | undefined;

/** Entrar con celular (clientes) o correo (admin / inversionista) + contraseña. */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Escribe tu celular (o correo) y tu contraseña." };

  let email: string;
  if (identifier.includes("@")) email = identifier.toLowerCase();
  else {
    const digits = identifier.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
    if (!/^3\d{9}$/.test(digits)) return { identifier, error: "El celular debe tener 10 dígitos y empezar por 3." };
    email = phoneToAuthEmail(digits);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "invalid_credentials" || /invalid login/i.test(error.message))
      return { identifier, error: "Los datos no coinciden. Revisa el celular o correo y la contraseña." };
    if (error.code === "over_request_rate_limit") return { identifier, error: "Demasiados intentos. Espera un minuto e intenta de nuevo." };
    console.error("[signIn]", error);
    return { identifier, error: "No pudimos entrar en este momento. Intenta de nuevo." };
  }

  const profile = await getProfile();
  if (!profile || profile.status !== "activo") {
    await supabase.auth.signOut();
    return { identifier, error: "Tu cuenta todavía no está activa. Te avisamos por WhatsApp cuando lo esté." };
  }
  redirect(homeFor(profile.role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Recuperar contraseña: solo para cuentas con correo real (admin / inversionista). */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Escribe un correo válido." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/auth/confirm?next=/cambiar-clave` });
  if (error) console.error("[reset]", error);
  // Misma respuesta exista o no la cuenta (no revelar qué correos están registrados).
  return { message: "Si ese correo tiene cuenta, te llegó un enlace para crear una contraseña nueva. Revisa también la carpeta de spam." };
}

/** Cambiar la contraseña estando con sesión (también tras el enlace de recuperación). */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener mínimo 8 caracteres." };
  if (password !== confirm) return { error: "Las dos contraseñas no coinciden." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Esa es tu contraseña actual. Escribe una diferente." };
    if (error.code === "weak_password") return { error: "Esa contraseña es muy fácil de adivinar. Usa una más larga." };
    console.error("[updatePassword]", error);
    return { error: "No pudimos cambiar la contraseña. El enlace pudo haber vencido; pide uno nuevo." };
  }
  const profile = await getProfile();
  redirect(profile ? homeFor(profile.role) : "/login");
}
