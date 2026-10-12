import type { Metadata } from "next";
import { ClienteShell } from "@/components/cliente/ClienteShell";

export const metadata: Metadata = { title: "Mi pedido" };

export default function ClienteLayout({ children }: LayoutProps<"/app">) {
  return <ClienteShell>{children}</ClienteShell>;
}
