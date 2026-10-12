"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Estado de instalación y notificaciones del navegador. */
export function usePwa() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [env, setEnv] = useState({ standalone: false, isIOS: false });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // Lectura única de capacidades del navegador al montar (no existen en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv({ standalone: window.matchMedia("(display-mode: standalone)").matches, isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent) });
    setPermission("Notification" in window ? Notification.permission : "unsupported");
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return "unsupported" as const;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.showNotification("Tostones Zenú", {
        body: "¡Listo! Te avisamos el jueves para que montes tu pedido.",
        icon: "/icons/icon-192.png",
      });
      // F4: aquí se crea la suscripción push (VAPID) y se guarda en push_subscriptions.
    }
    return p;
  }

  return { canInstall: !!installEvt, install, ...env, permission, enableNotifications };
}
