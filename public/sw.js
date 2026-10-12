/* Service worker — Tostones Zenú
   - Caché "network-first" para páginas (abre sin red con el último estado)
   - Caché "cache-first" para estáticos
   - Notificaciones push (recordatorio de pedido / pedido en camino) */
const VERSION = "tz-v1";
const PRECACHE = ["/", "/app", "/brand/logo.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const isStatic = /\/(_next\/static|icons|brand)\//.test(req.url);
  if (isStatic) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
    })));
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("/app"))));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(self.registration.showNotification(data.title || "Tostones Zenú", {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/favicon-64.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/app" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(self.clients.matchAll({ type: "window" }).then((wins) => {
    const open = wins.find((w) => w.url.includes(url));
    return open ? open.focus() : self.clients.openWindow(url);
  }));
});
