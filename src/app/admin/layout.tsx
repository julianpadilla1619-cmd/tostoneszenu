import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Bell, BellLink } from "@/components/shared/Bell";
import { requirePage } from "@/lib/auth";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell
      bell={
        <Suspense fallback={<BellLink href="/admin/avisos" />}>
          <AdminBell />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  );
}

async function AdminBell() {
  const me = await requirePage(["admin"]);
  return <Bell profileId={me.id} href="/admin/avisos" />;
}
