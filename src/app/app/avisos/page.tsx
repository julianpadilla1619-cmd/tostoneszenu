import { Suspense } from "react";
import { Avisos } from "@/components/shared/Avisos";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";

export default function AvisosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const me = await requirePage(["mayorista"]);
  return <Avisos me={me} />;
}
