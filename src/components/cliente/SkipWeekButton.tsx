"use client";

import { CalendarX2, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { setMyWeekSkip } from "@/app/actions/cliente";
import { FormError, Spinner } from "@/components/ui/ui";

/** "Esta semana no pido" / "Cambié de opinión". */
export function SkipWeekButton({ skip }: { skip: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setMyWeekSkip(skip);
            setError(r.ok ? null : r.error);
          })
        }
        className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cana/20 px-4 text-sm font-semibold text-cana/90 transition active:scale-[.97] disabled:opacity-50"
      >
        {pending ? <Spinner /> : skip ? <CalendarX2 className="size-4" aria-hidden /> : <Undo2 className="size-4" aria-hidden />}
        {skip ? "Esta semana no pido" : "Cambié de opinión"}
      </button>
      <FormError message={error} />
    </>
  );
}
