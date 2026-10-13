"use client";

import { Circle, CircleCheck } from "lucide-react";
import { useOptimistic, useTransition, type ReactNode } from "react";
import type { ActionResult, ScheduleTask } from "@/lib/types";

export function TaskToggle({ task, action, children }: { task: ScheduleTask; action: () => Promise<ActionResult<unknown>>; children?: ReactNode }) {
  const [, start] = useTransition();
  const [done, setDone] = useOptimistic(task.done);
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() =>
        start(async () => {
          setDone(!done);
          await action();
        })
      }
      className="flex min-h-11 w-full cursor-pointer items-start gap-2.5 rounded-xl p-2 text-left text-sm hover:bg-card-2"
    >
      {done ? <CircleCheck className="mt-0.5 size-[1.1rem] shrink-0 text-ok" aria-hidden /> : <Circle className="mt-0.5 size-[1.1rem] shrink-0 text-tinta-2" aria-hidden />}
      <span className="flex-1">
        <span className={done ? "text-tinta-2 line-through" : ""}>{task.title}</span>
        {children}
      </span>
    </button>
  );
}
