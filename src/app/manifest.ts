import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tostones Zenú · Sabor Tuchinero",
    short_name: "Tostones Zenú",
    description: "Pedidos al por mayor de Tostones Zenú, hechos a mano en Tuchín, Córdoba.",
    lang: "es-CO",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#15110c",
    theme_color: "#15110c",
    categories: ["food", "business", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hacer pedido", url: "/app/pedido" },
      { name: "Panel admin", url: "/admin" },
    ],
  };
}
