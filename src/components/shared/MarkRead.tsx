"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/app/actions/cliente";

/** Marca los avisos como leídos un momento después de abrir la bandeja. */
export function MarkRead() {
  useEffect(() => {
    const t = setTimeout(() => void markNotificationsRead(), 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
