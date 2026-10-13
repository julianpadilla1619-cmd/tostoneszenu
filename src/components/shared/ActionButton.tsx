"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button, Spinner, useToast } from "@/components/ui/ui";
import type { ActionResult } from "@/lib/types";

/**
 * Botón que ejecuta una Server Action (ya con sus argumentos ligados con .bind)
 * y muestra carga + resultado. `confirm` pide confirmación antes (acciones destructivas).
 */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "suave",
  size = "sm",
  icon,
  className,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
  confirm?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  icon?: ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [toast, showToast] = useToast();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        icon={pending ? <Spinner /> : icon}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const r = await action();
            if (r.ok) {
              setError(null);
              if (r.message) showToast(r.message);
            } else setError(r.error);
          });
        }}
      >
        {children}
      </Button>
      {error && (
        <span role="alert" className="text-xs font-semibold text-mal">
          {error}
        </span>
      )}
      {toast}
    </>
  );
}
