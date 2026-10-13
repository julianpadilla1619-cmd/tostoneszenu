import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { type: "website", locale: "es_CO", siteName: "Tostones Zenú", images: ["/brand/logo-640.webp"] },
  title: { default: "Tostones Zenú · El sabor original del Zenú", template: "%s · Tostones Zenú" },
  description:
    "Tajadas de plátano y papa hechas a mano en Tuchín, Córdoba. Venta al por mayor para tiendas, cafeterías y revendedores: pides desde el celular y te lo llevamos.",
  applicationName: "Tostones Zenú",
  appleWebApp: { capable: true, title: "Tostones Zenú", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/favicon-64.png", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#15110c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
