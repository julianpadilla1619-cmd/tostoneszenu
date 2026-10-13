"use client";

import clsx from "clsx";
import { Minus, Plus, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { STATUS_LABEL } from "@/lib/labels";
import type { OrderStatus } from "@/lib/types";

// ---------- Botón ----------
type Variant = "oro" | "noche" | "suave" | "borde" | "peligro" | "fantasma";
const variants: Record<Variant, string> = {
  oro: "bg-oro text-noche shadow-[var(--shadow-oro)] hover:bg-oro-claro",
  noche: "bg-noche text-cana hover:bg-tierra-3",
  suave: "bg-card-2 text-tinta hover:brightness-95",
  borde: "border border-linea bg-transparent text-tinta hover:bg-card-2",
  peligro: "bg-mal/12 text-mal hover:bg-mal/20",
  fantasma: "bg-transparent text-tinta-2 hover:bg-card-2 hover:text-tinta",
};

export function Button({
  variant = "oro",
  size = "md",
  className,
  icon,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[.97] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-12 px-5 text-[0.95rem]",
        size === "lg" && "h-14 px-6 text-base",
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Tarjeta ----------
export function Card({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={clsx("rounded-[var(--radius-card)] border border-linea bg-card p-4", className)}>{children}</As>;
}

export function CardTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="font-display text-lg font-bold">{children}</h3>
      {action}
    </div>
  );
}

// ---------- Estado de pedido ----------
const statusStyle: Record<OrderStatus, string> = {
  borrador: "bg-tinta-2/15 text-tinta-2",
  confirmado: "bg-oro/20 text-acento",
  no_pide: "bg-tinta-2/10 text-tinta-2",
  cancelado: "bg-mal/12 text-mal",
  en_produccion: "bg-serie-3/18 text-serie-3",
  en_camino: "bg-toston/25 text-acento",
  entregado: "bg-ok/15 text-ok",
};
const statusDot: Record<OrderStatus, string> = {
  borrador: "border border-current",
  confirmado: "bg-current",
  no_pide: "border border-dashed border-current",
  cancelado: "bg-current",
  en_produccion: "bg-current animate-pulse",
  en_camino: "bg-current animate-pulse",
  entregado: "bg-current",
};

export function StatusBadge({ status, className, emptyLabel = "Sin respuesta" }: { status: OrderStatus | "sin_pedido"; className?: string; emptyLabel?: string }) {
  if (status === "sin_pedido")
    return (
      <span className={clsx("inline-flex items-center gap-1.5 rounded-full bg-mal/10 px-2.5 py-1 text-xs font-semibold text-mal", className)}>
        <span className="size-1.5 rounded-full border border-current" aria-hidden /> {emptyLabel}
      </span>
    );
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", statusStyle[status], className)}>
      <span className={clsx("size-1.5 rounded-full", statusDot[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full bg-card-2 px-2.5 py-1 text-xs font-semibold text-tinta-2", className)}>{children}</span>;
}

// ---------- Contador +/− ----------
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  label,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        className="grid size-12 cursor-pointer place-items-center rounded-2xl bg-card-2 text-tinta transition active:scale-90 disabled:opacity-35"
        aria-label={`Quitar ${step} de ${label}`}
      >
        <Minus className="size-5" strokeWidth={2.4} />
      </button>
      <input
        inputMode="numeric"
        disabled={disabled}
        aria-label={`Cantidad de ${label}`}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "")) || 0))}
        className="tabular h-12 w-16 rounded-2xl border border-linea bg-transparent text-center font-display text-2xl font-bold outline-none focus:border-oro"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + step))}
        className="grid size-12 cursor-pointer place-items-center rounded-2xl bg-noche text-oro transition active:scale-90 disabled:opacity-35"
        aria-label={`Agregar ${step} de ${label}`}
      >
        <Plus className="size-5" strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ---------- Formularios ----------
export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-tinta-2">{hint}</p>}
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-2xl border border-linea bg-card px-4 text-base text-tinta outline-none transition placeholder:text-tinta-2/60 focus:border-oro focus:ring-4 focus:ring-oro/15";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputCls, props.className)} />;
}
const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239a7d55' stroke-width='2.2' stroke-linecap='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", ...props.style }}
      className={clsx(inputCls, "cursor-pointer appearance-none pr-10", props.className)}
    />
  );
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(inputCls, "h-auto min-h-24 py-3", props.className)} />;
}

// ---------- Hoja inferior (modal móvil) ----------
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-noche/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg"
    >
      <div className="pb-safe max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] border border-linea bg-fondo px-5 pt-3 text-tinta sm:rounded-[1.75rem]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-tinta-2/30 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full bg-card-2" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

// ---------- KPI ----------
export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "ok" | "mal" | "oro";
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-[var(--radius-card)] border border-linea bg-card p-4", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-tinta-2">
        {label}
        {icon && <span className="text-tinta-2">{icon}</span>}
      </div>
      <div
        className={clsx(
          "tabular mt-2 whitespace-nowrap font-display text-[1.3rem] font-bold leading-none sm:text-[1.6rem]",
          tone === "ok" && "text-ok",
          tone === "mal" && "text-mal",
          tone === "oro" && "text-acento",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-tinta-2">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-linea px-6 py-10 text-center">
      {icon && <div className="text-tinta-2">{icon}</div>}
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="text-sm text-tinta-2">{children}</div>}
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const node = <Toast message={message} onDone={() => setMessage(null)} />;
  return [node, setMessage] as const;
}

function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => done.current(), 2600);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      {message && (
        <div className="animate-subir rounded-2xl bg-noche px-4 py-3 text-sm font-semibold text-cana shadow-2xl ring-1 ring-oro/30">{message}</div>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={clsx("scroll-x flex gap-1 overflow-x-auto rounded-2xl bg-card-2 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition",
            value === o.value ? "bg-noche text-oro shadow" : "text-tinta-2 hover:text-tinta",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Carga ----------
export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} />;
}

/** Botón de envío que se deshabilita y muestra carga mientras el formulario se procesa. */
export function SubmitButton({ children, pendingText = "Guardando…", ...rest }: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || rest.disabled} aria-busy={pending} {...rest} icon={pending ? <Spinner /> : rest.icon}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-[var(--radius-card)] bg-card-2", className)} />;
}

/** Interruptor accesible (checkbox nativo con estilo). */
export function Switch({ name, defaultChecked, label, hint }: { name: string; defaultChecked?: boolean; label: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-semibold text-tinta">{label}</span>
        {hint && <span className="block text-xs text-tinta-2">{hint}</span>}
      </span>
      <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-tinta-2/30 transition peer-checked:bg-oro peer-focus-visible:ring-2 peer-focus-visible:ring-oro after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-mal/12 px-3 py-2 text-sm font-medium text-mal">
      {message}
    </p>
  );
}
