import { Suspense } from "react";
import { FinanzasView } from "@/components/admin/FinanzasView";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { expenseCategories, expensesBetween, incomesBetween } from "@/lib/data";
import { addDays } from "@/lib/format";
import { todayBogota } from "@/lib/time";

export default function FinanzasPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Finanzas />
    </Suspense>
  );
}

async function Finanzas() {
  await requirePage(["admin"]);
  const today = todayBogota();
  const from = `${Number(today.slice(0, 4)) - 1}-12-01`;
  const to = addDays(today, 31);
  const [incomes, expenses, categories] = await Promise.all([incomesBetween(from, to), expensesBetween(from, to), expenseCategories()]);
  return <FinanzasView today={today} incomes={incomes} expenses={expenses} categories={categories} />;
}
