"use server";

import { after } from "next/server";
import { check, run } from "@/lib/action";
import { notify } from "@/lib/notify";
import { createPublicClient } from "@/lib/supabase/public";
import { int, phone, text, ValidationError } from "@/lib/validate";

/** Formulario público "Quiero ser cliente". Inserta como anónimo (RLS lo permite). */
export async function submitSignupRequest(formData: FormData) {
  return run(async () => {
    // Campo trampa para bots: las personas no lo ven ni lo llenan.
    if (String(formData.get("website") ?? "")) return { ok: true as const };

    const fullName = text(formData, "name", { required: true, max: 80, label: "tu nombre" })!;
    const businessName = text(formData, "business", { required: true, max: 80, label: "el nombre del negocio" });
    const cel = phone(formData);
    const municipality = text(formData, "municipality", { required: true, max: 60, label: "el municipio" });
    const packs = int(formData, "packs", { min: 0, max: 100000 });
    const message = text(formData, "message", { max: 500 });
    if (packs !== null && packs < 10) throw new ValidationError("Vendemos desde 10 paquetes por pedido.");

    const db = createPublicClient();
    check(
      await db.from("signup_requests").insert({
        full_name: fullName,
        business_name: businessName,
        phone: cel,
        municipality,
        est_weekly_packs: packs,
        message,
        requested_role: "mayorista",
        status: "nueva",
      }),
      "No pudimos registrar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.",
    );

    after(() =>
      notify(
        { admins: true },
        { title: "Nueva solicitud de cliente", body: `${businessName} (${fullName}) de ${municipality} quiere comprar al por mayor.`, url: "/admin/clientes" },
      ),
    );
    return { ok: true as const, data: fullName.split(" ")[0] };
  });
}
