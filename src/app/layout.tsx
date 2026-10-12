import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { StoreProvider } from "@/lib/store";
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
  title: { default: "Tostones Zenú · Sabor Tuchinero", template: "%s · Tostones Zenú" },
  description:
    "Tostones de plátano y papas al por mayor desde Tuchín, Córdoba. Haz tu pedido de la semana desde el celular.",
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
        <StoreProvider>{children}</StoreProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
