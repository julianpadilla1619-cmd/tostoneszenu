// Formato es-CO. Las fechas "YYYY-MM-DD" se interpretan en hora local (sin corrimiento UTC).

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n: number) => cop.format(n).replace(/ /g, " ");
export const qty = (n: number) => num.format(n);
export const moneyShort = (n: number) => `$ ${compact.format(n)}`;
export const pct = (n: number) => `${num.format(Math.round(n))} %`;

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + days);
  return toISODay(d);
}

const fDay = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" });
const fLong = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const fShort = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const fWeekday = new Intl.DateTimeFormat("es-CO", { weekday: "long" });

const clean = (s: string) => s.replace(/\./g, "").replace(/\s+de\s+/g, " ");
export const dayLabel = (iso: string) => clean(fDay.format(parseDay(iso)));
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const dayLong = (iso: string) => cap(fLong.format(parseDay(iso)));
export const dayShort = (iso: string) => clean(fShort.format(parseDay(iso)));
export const weekdayName = (iso: string) => fWeekday.format(parseDay(iso));

export function weekRange(startsOn: string) {
  return `${dayShort(startsOn)} – ${dayShort(addDays(startsOn, 6))}`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
