import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Brand";
import { ClienteShell } from "@/components/cliente/ClienteShell";
import { Bell, BellLink } from "@/components/shared/Bell";
import { requirePage } from "@/lib/auth";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function ClienteLayout({ children }: LayoutProps<"/app">) {
  return (
    <ClienteShell
      header={
        <Suspense fallback={<HeaderContent />}>
          <ClienteHeader />
        </Suspense>
      }
    >
      {children}
    </ClienteShell>
  );
}

async function ClienteHeader() {
  const me = await requirePage(["mayorista"]);
  return (
    <HeaderContent name={me.businessName ?? me.fullName}>
      <Bell profileId={me.id} href="/app/avisos" />
    </HeaderContent>
  );
}

function HeaderContent({ name, children }: { name?: string; children?: React.ReactNode }) {
  return (
    <>
      <Link href="/app" className="flex min-w-0 items-center gap-2.5">
        <Logo size={38} />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[0.95rem] font-black">{name ?? "Tostones Zenú"}</p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-canela">Cliente mayorista</p>
        </div>
      </Link>
      {children ?? <BellLink href="/app/avisos" />}
    </>
  );
}
