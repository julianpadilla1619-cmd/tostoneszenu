import { Suspense } from "react";
import { PageHead } from "@/components/admin/AdminShell";
import { ProductosView } from "@/components/admin/ProductosView";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";
import { adminProducts } from "@/lib/data";

export default function ProductosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Productos />
    </Suspense>
  );
}

async function Productos() {
  await requirePage(["admin"]);
  const products = await adminProducts();
  return (
    <>
      <PageHead title="Productos" sub="Lo que ven tus clientes en la página y al pedir. Los destacados salen primero." />
      <ProductosView products={products} />
    </>
  );
}
