import "server-only";
import { AuthError } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { ValidationError } from "@/lib/validate";

/** Ejecuta una acción y convierte errores esperados en mensajes para la persona. */
export async function run<T>(fn: () => Promise<T | ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const out = await fn();
    if (out && typeof out === "object" && "ok" in out) return out as ActionResult<T>;
    return { ok: true, data: out as T };
  } catch (err) {
    if (err instanceof ValidationError || err instanceof AuthError) return { ok: false, error: err.message };
    // Errores de redirect/notFound de Next deben seguir su curso.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[action]", err);
    return { ok: false, error: "Algo salió mal. Intenta de nuevo en un momento." };
  }
}

/** Lanza si la consulta de Supabase falló. */
export function check<T extends { error: { message: string; code?: string } | null }>(res: T, msg = "No se pudo guardar."): T {
  if (res.error) {
    console.error("[db]", res.error);
    if (res.error.code === "23505") throw new ValidationError("Ya existe un registro con esos datos.");
    if (res.error.code === "23503") throw new ValidationError("No se puede borrar porque tiene registros relacionados.");
    throw new ValidationError(msg);
  }
  return res;
}
