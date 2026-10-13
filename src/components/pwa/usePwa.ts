"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/cliente";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

type PushState = "unsupported" | "denied" | "off" | "on" | "loading";

function b64ToUint8(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Instalación de la app y suscripción a notificaciones push de este dispositivo. */
export function usePwa() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [env, setEnv] = useState({ standalone: false, isIOS: false });
  const [push, setPush] = useState<PushState>("loading");

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Lectura única de capacidades del navegador (no existen en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv({ standalone, isIOS });
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!supported) setPush("unsupported");
    else if (Notification.permission === "denied") setPush("denied");
    else
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPush(sub ? "on" : "off"))
        .catch(() => setPush("off"));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
  }

  async function enablePush(): Promise<string | null> {
    setPush("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPush(perm === "denied" ? "denied" : "off");
        return "Debes permitir las notificaciones en el navegador.";
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const r = await savePushSubscription(json);
      if (!r.ok) throw new Error(r.error);
      setPush("on");
      return null;
    } catch (err) {
      console.error(err);
      setPush("off");
      return "No pudimos activar los avisos en este celular. Intenta de nuevo.";
    }
  }

  async function disablePush() {
    setPush("loading");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setPush("off");
  }

  return { canInstall: !!installEvt, install, ...env, push, enablePush, disablePush };
}
