import { Suspense } from "react";
import { PageHead } from "@/components/admin/AdminShell";
import { AjustesView } from "@/components/admin/AjustesView";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminFaqs, adminSettings, expenseCategories } from "@/lib/data";

export default function AjustesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh]" />}>
      <Ajustes />
    </Suspense>
  );
}

async function Ajustes() {
  await requirePage(["admin"]);
  const [settings, faqs, categories] = await Promise.all([adminSettings(), adminFaqs(), expenseCategories()]);
  return (
    <>
      <PageHead title="Ajustes" sub="Entregas, pedido mínimo, contacto, textos de la página y categorías de gasto." />
      <AjustesView settings={settings} faqs={faqs} categories={categories} />
    </>
  );
}
