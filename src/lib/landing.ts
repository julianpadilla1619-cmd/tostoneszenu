// Textos de la página principal. El admin los edita en Ajustes; lo que no
// edite usa estos valores. Comodines: {minimo} {dias} {hora} {anticipacion}.
import { hour12 } from "./format";
import { weekdayList } from "./time";
import type { LandingTexts, Settings } from "./types";

export const DEFAULT_LANDING: LandingTexts = {
  intro:
    "Tajadas de plátano y papa hechas a mano en Tuchín, Córdoba, tierra del sombrero vueltiao. Vendemos al por mayor a tiendas, cafeterías y revendedores: haces tu pedido desde el celular y te lo llevamos los {dias}.",
  productsTitle: "Tajadas crocantes, listas para tu vitrina.",
  productsNote: "Precios al por mayor. Pedido mínimo de {minimo} paquetes, que puedes combinar entre productos.",
  steps: [
    { title: "Envía tu solicitud", text: "Llena el formulario con tus datos. Es gratis y sin compromiso." },
    { title: "Te contactamos y creamos tu cuenta", text: "Te escribimos por WhatsApp o correo con tu usuario (tu celular) y una contraseña para entrar." },
    { title: "Pides desde el celular", text: "Eliges cuántos paquetes quieres y el día de entrega. Mínimo {minimo} paquetes por pedido." },
  ],
  weekTitle: "Así trabajamos cada semana.",
  weekText: "Fritamos para cada entrega. Puedes pedir o cambiar tu pedido hasta las {hora}, {anticipacion} antes de la entrega, y ese día te mandamos un recordatorio al celular.",
  signupTitle: "Vende Tostones Zenú en tu negocio.",
  signupText: "Déjanos tus datos y te contactamos para crearte la cuenta.",
};

/** Mezcla lo guardado en la base con los valores por defecto (campo vacío = valor por defecto). */
export function mergeLanding(raw: unknown): LandingTexts {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<LandingTexts>;
  const str = (k: Exclude<keyof LandingTexts, "steps">) => (typeof r[k] === "string" && r[k]!.trim() ? r[k]!.trim() : DEFAULT_LANDING[k]);
  return {
    intro: str("intro"),
    productsTitle: str("productsTitle"),
    productsNote: str("productsNote"),
    steps: DEFAULT_LANDING.steps.map((d, i) => ({
      title: r.steps?.[i]?.title?.trim() || d.title,
      text: r.steps?.[i]?.text?.trim() || d.text,
    })),
    weekTitle: str("weekTitle"),
    weekText: str("weekText"),
    signupTitle: str("signupTitle"),
    signupText: str("signupText"),
  };
}

export const anticipacion = (days: number) => (days === 1 ? "un día" : days === 2 ? "dos días" : `${days} días`);

/** Reemplaza los comodines por los valores actuales de Ajustes. */
export function fill(text: string, s: Settings) {
  return text
    .replaceAll("{minimo}", String(s.wholesaleMinPacks))
    .replaceAll("{dias}", weekdayList(s.deliveryWeekdays))
    .replaceAll("{hora}", hour12(s.cutoffTime))
    .replaceAll("{anticipacion}", anticipacion(s.cutoffDaysBefore));
}
