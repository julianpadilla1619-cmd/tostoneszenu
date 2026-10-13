"use server";

import { after } from "next/server";
import { check, run } from "@/lib/action";
import { notify } from "@/lib/notify";
import { createPublicClient } from "@/lib/supabase/public";
import { email, int, phone, text, ValidationError } from "@/lib/validate";

/** Formulario público "Quiero ser cliente". Inserta como anónimo (RLS lo permite) y avisa a los admins. */
export async function submitSignupRequest(formData: FormData) {
  return run(async () => {
    // Campo trampa para bots: las personas no lo ven ni lo llenan.
    if (String(formData.get("website") ?? "")) return { ok: true as const };

    const fullName = text(formData, "name", { required: true, max: 80, label: "tu nombre" })!;
    const businessName = text(formData, "business", { max: 80 });
    const cel = phone(formData);
    const mail = email(formData, "email");
    const picked = text(formData, "municipality", { required: true, max: 60, label: "el municipio" });
    const municipality = picked === "Otro" ? text(formData, "municipality_other", { required: true, max: 60, label: "el nombre de tu municipio" }) : picked;
    const packs = int(formData, "packs", { min: 0, max: 100000 });
    const message = text(formData, "message", { max: 500 });
    if (packs !== null && packs < 10) throw new ValidationError("Vendemos desde 10 paquetes por pedido.");

    const db = createPublicClient();
    check(
      await db.from("signup_requests").insert({
        full_name: fullName,
        business_name: businessName,
        phone: cel,
        email: mail,
        municipality,
        est_weekly_packs: packs,
        message,
        requested_role: "mayorista",
        status: "nueva",
      }),
      "No pudimos registrar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.",
    );

    const lines = [
      `${fullName}${businessName ? ` (${businessName})` : ""} quiere comprar al por mayor.`,
      `Celular: ${cel}`,
      mail ? `Correo: ${mail}` : null,
      `Municipio: ${municipality}`,
      packs ? `Paquetes por semana: ${packs}` : null,
      message ? `Mensaje: “${message}”` : null,
    ].filter(Boolean);
    after(() => notify({ admins: true }, { title: "Nueva solicitud de cliente", body: lines.join("\n"), url: "/admin/clientes" }));
    return { ok: true as const, data: fullName.split(" ")[0] };
  });
}
