import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inversionista" };

export default function InversorLayout({ children }: LayoutProps<"/inversor">) {
  return children;
}
