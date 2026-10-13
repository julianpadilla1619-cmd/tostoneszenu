// Lectura y validación de FormData en el servidor.

export class ValidationError extends Error {}

export function text(f: FormData, key: string, opts: { required?: boolean; max?: number; label?: string } = {}) {
  const v = String(f.get(key) ?? "").trim();
  if (opts.required && !v) throw new ValidationError(`Falta ${opts.label ?? key}.`);
  if (opts.max && v.length > opts.max) throw new ValidationError(`${opts.label ?? key} es muy largo (máximo ${opts.max} caracteres).`);
  return v || null;
}

export function int(f: FormData, key: string, opts: { required?: boolean; min?: number; max?: number; label?: string } = {}) {
  const raw = String(f.get(key) ?? "").replace(/[^\d-]/g, "");
  if (!raw) {
    if (opts.required) throw new ValidationError(`Falta ${opts.label ?? key}.`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new ValidationError(`${opts.label ?? key} debe ser un número entero.`);
  if (opts.min !== undefined && n < opts.min) throw new ValidationError(`${opts.label ?? key} debe ser mínimo ${opts.min}.`);
  if (opts.max !== undefined && n > opts.max) throw new ValidationError(`${opts.label ?? key} debe ser máximo ${opts.max}.`);
  return n;
}

export function decimal(f: FormData, key: string) {
  const raw = String(f.get(key) ?? "").replace(",", ".").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${key} no es un número válido.`);
  return n;
}

/** Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 y espacios). */
export function phone(f: FormData, key?: string): string;
export function phone(f: FormData, key: string, required: false): string | null;
export function phone(f: FormData, key = "phone", required = true): string | null {
  const digits = String(f.get(key) ?? "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
  if (!digits && !required) return null;
  if (!/^3\d{9}$/.test(digits)) throw new ValidationError("Escribe un celular de 10 dígitos que empiece por 3.");
  return digits;
}

export function email(f: FormData, key = "email", required = false) {
  const v = String(f.get(key) ?? "").trim().toLowerCase();
  if (!v) {
    if (required) throw new ValidationError("Falta el correo.");
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new ValidationError("El correo no es válido.");
  return v;
}

export function date(f: FormData, key: string, required = true) {
  const v = String(f.get(key) ?? "");
  if (!v && !required) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ValidationError("Fecha no válida.");
  return v;
}

export function oneOf<T extends string>(f: FormData, key: string, values: readonly T[], fallback?: T): T {
  const v = String(f.get(key) ?? "") as T;
  if (values.includes(v)) return v;
  if (fallback) return fallback;
  throw new ValidationError(`Valor no válido para ${key}.`);
}

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

/** Contraseña temporal fácil de dictar: 3 letras + 4 números (sin caracteres confusos). */
export function tempPassword() {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint32Array(7));
  const l = Array.from(bytes.slice(0, 3), (b) => letters[b % letters.length]).join("");
  const n = Array.from(bytes.slice(3), (b) => String(b % 10)).join("");
  return `${l.charAt(0).toUpperCase()}${l.slice(1)}${n}`;
}
