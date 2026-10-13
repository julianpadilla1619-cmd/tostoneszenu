import { Suspense } from "react";
import { Avisos } from "@/components/shared/Avisos";
import { PreferencesForm } from "@/components/shared/PreferencesForm";
import { Skeleton } from "@/components/ui/ui";
import { requirePage } from "@/lib/auth";

export default function AdminAvisos() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const me = await requirePage(["admin"]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Avisos me={me} />
      <div className="lg:pt-14">
        <PreferencesForm profile={me} />
      </div>
    </div>
  );
}
