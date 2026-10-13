import Link from "next/link";
import { ArrowRight, BellRing, ClipboardCheck, MapPin, MessageCircle, PackageCheck, Smartphone, UserPlus } from "lucide-react";
import { Logo, ProductArt, Rombo, Wordmark } from "@/components/brand/Brand";
import { WeekCalendar } from "@/components/brand/WeekCalendar";
import { SignupForm } from "@/components/cliente/SignupForm";
import { getCatalog } from "@/lib/data";
import { hour12, money } from "@/lib/format";
import { CATEGORY_LABEL, MUNICIPIOS } from "@/lib/labels";
import { weekdayList } from "@/lib/time";

export default async function Landing() {
  const { settings, products, faqs } = await getCatalog();
  const days = weekdayList(settings.deliveryWeekdays);
  const min = settings.wholesaleMinPacks;
  const sorted = [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort);
  const wa = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hola, quiero información para comprar Tostones Zenú al por mayor.")}`
    : null;

  const pasos = [
    { icon: UserPlus, t: "Envía la solicitud", d: "Llena el formulario de abajo con los datos de tu negocio. Es gratis y sin compromiso." },
    { icon: ClipboardCheck, t: "Te creamos la cuenta", d: "Te escribimos por WhatsApp con tu usuario (tu celular) y una contraseña para entrar." },
    { icon: PackageCheck, t: "Pides desde el celular", d: `Eliges cuántos paquetes quieres y el día de entrega. Mínimo ${min} paquetes por pedido.` },
  ];

  return (
    <div className="tema-claro bg-fondo text-tinta">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-oro focus:px-4 focus:py-2 focus:text-noche">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-oro/15 bg-noche/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Tostones Zenú, inicio">
            <Logo size={40} priority />
            <Wordmark dark className="hidden min-[350px]:flex" />
          </Link>
          <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm font-semibold text-cana/75 md:flex">
            <a href="#productos" className="hover:text-oro">Productos</a>
            <a href="#como" className="hover:text-oro">Cómo funciona</a>
            <a href="#semana" className="hover:text-oro">La semana</a>
            <a href="#preguntas" className="hover:text-oro">Preguntas</a>
          </nav>
          <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-oro px-4 text-sm font-bold text-noche transition hover:bg-oro-claro active:scale-95">
            Entrar
          </Link>
        </div>
      </header>

      <main id="contenido">
        {/* Héroe */}
        <section className="grano relative overflow-hidden bg-noche text-cana">
          <div className="rombos-oscuro absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-14 pt-10 md:grid-cols-[1.15fr_.85fr] md:pb-20 md:pt-14">
            <div className="animate-subir">
              <Logo size={96} priority className="mb-5 drop-shadow-[0_16px_24px_rgba(0,0,0,.5)] md:hidden" />
              <p className="inline-flex items-center gap-2 rounded-full border border-oro/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-oro">
                <Rombo className="size-3.5" /> Tuchín, Córdoba
              </p>
              <h1 className="mt-5 text-balance font-display text-[2.4rem] font-black leading-[1.02] sm:text-6xl">{settings.headline}</h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-cana/80">
                Tajadas de plátano y papa hechas a mano en Tuchín, Córdoba, tierra del sombrero vueltiao. Vendemos al por mayor a tiendas, cafeterías y revendedores: haces tu pedido desde el celular y te lo llevamos los {days}.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#solicitud" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-oro px-6 font-bold text-noche shadow-[var(--shadow-oro)] transition hover:bg-oro-claro active:scale-[.97]">
                  Quiero ser cliente <ArrowRight className="size-5" aria-hidden />
                </a>
                <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-2xl border border-cana/25 px-6 font-semibold text-cana transition hover:border-oro hover:text-oro">
                  Ya tengo cuenta
                </Link>
              </div>
              <dl className="mt-9 grid max-w-md grid-cols-3 gap-3 border-t border-cana/10 pt-6 text-sm">
                {[
                  ["Pedido mínimo", `${min} paquetes`],
                  ["Entregas", days.charAt(0).toUpperCase() + days.slice(1)],
                  ["Pago", "Contra entrega"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-cana/60">{k}</dt>
                    <dd className="mt-1 font-display text-base font-bold leading-tight text-oro-claro">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative mx-auto hidden aspect-square w-full max-w-[380px] place-items-center md:grid">
              <div className="absolute inset-0 animate-girar rounded-full border-2 border-dashed border-oro/25" aria-hidden />
              <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgb(217_169_58/.28),transparent_65%)]" aria-hidden />
              <div className="animate-flotar">
                <Logo size={320} priority className="drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]" />
              </div>
            </div>
          </div>
        </section>
        <div className="trenza" aria-hidden />

        {/* Productos */}
        <section id="productos" aria-labelledby="t-productos" className="rombos scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <SectionHead id="t-productos" kicker="Lo que hacemos" title="Tajadas crocantes, listas para tu vitrina." />
            {sorted.length === 0 ? (
              <p className="mt-8 text-tinta-2">Muy pronto publicamos los productos.</p>
            ) : (
              <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((p) => (
                  <li key={p.id}>
                    <article className="flex h-full flex-col rounded-[1.5rem] border border-linea bg-card p-5 shadow-[var(--shadow-calida)]">
                      <div className="flex items-start gap-4">
                        <ProductArt kind={p.category} className="size-20 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-canela">
                            {CATEGORY_LABEL[p.category]} · {p.weightGrams} g
                          </p>
                          <h3 className="mt-1 font-display text-xl font-black leading-tight">{p.name}</h3>
                          {p.featured && <span className="mt-1.5 inline-block rounded-full bg-oro/20 px-2 py-0.5 text-xs font-semibold text-acento">Destacado</span>}
                        </div>
                      </div>
                      {p.description && <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-tinta-2">{p.description}</p>}
                      <div className="mt-4 flex items-end justify-between border-t border-dashed border-linea pt-4">
                        <span className="text-sm text-tinta-2">Precio por paquete</span>
                        <span className="tabular font-display text-2xl font-black">{money(p.price)}</span>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-tinta-2">Precios al por mayor. Pedido mínimo de {min} paquetes, que puedes combinar entre productos.</p>
          </div>
        </section>

        {/* Cómo funciona + entregas */}
        <section id="como" aria-labelledby="t-como" className="scroll-mt-16 border-y border-linea bg-card-2/60">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <SectionHead id="t-como" kicker="Cómo funciona" title="Tres pasos y ya estás pidiendo." />
            <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
              {pasos.map((p, i) => (
                <li key={p.t}>
                  <span aria-hidden className="font-display text-6xl font-black leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-canela)]">
                    0{i + 1}
                  </span>
                  <div className="mt-3 flex items-center gap-2.5">
                    <span className="grid size-10 place-items-center rounded-xl bg-noche text-oro">
                      <p.icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="font-display text-xl font-bold">{p.t}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-tinta-2">{p.d}</p>
                </li>
              ))}
            </ol>

          </div>
        </section>

        {/* La semana */}
        <section id="semana" aria-labelledby="t-semana" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <SectionHead id="t-semana" kicker="La semana" title="Así trabajamos cada semana." />
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tinta-2">
              Fritamos para cada entrega. Puedes pedir o cambiar tu pedido hasta las {hour12(settings.cutoffTime)} del día anterior, y el día antes te mandamos un recordatorio al celular.
            </p>
            <div className="mt-8">
              <WeekCalendar deliveryWeekdays={settings.deliveryWeekdays} cutoffTime={settings.cutoffTime} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info icon={<MapPin className="size-5" />} title="Zonas de entrega">
                {settings.zones}
              </Info>
              <Info icon={<BellRing className="size-5" />} title="Avisos al celular">
                Te avisamos cuando tu pedido va en camino y cuando se acerca la hora límite.
              </Info>
            </div>
          </div>
        </section>

        {/* Preguntas */}
        {faqs.length > 0 && (
          <section id="preguntas" aria-labelledby="t-preguntas" className="scroll-mt-16">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[.8fr_1.2fr] md:py-20">
              <SectionHead id="t-preguntas" kicker="Preguntas" title="Lo que siempre nos preguntan." />
              <div className="divide-y divide-linea rounded-[1.5rem] border border-linea bg-card">
                {faqs.map((f) => (
                  <details key={f.id} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                      {f.question}
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-card-2 text-lg transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="pb-4 leading-relaxed text-tinta-2">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Solicitud */}
        <section id="solicitud" aria-labelledby="t-solicitud" className="tema-oscuro grano relative scroll-mt-16 overflow-hidden bg-noche text-cana">
          <div className="rombos-oscuro absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-oro">Quiero ser cliente</p>
              <h2 id="t-solicitud" className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">
                Vende Tostones Zenú en tu negocio.
              </h2>
              <p className="mt-4 max-w-md text-lg text-cana/80">Déjanos tus datos y te escribimos por WhatsApp para crearte la cuenta.</p>
              <ul className="mt-6 space-y-3 text-cana/85">
                {[
                  `Desde ${min} paquetes por pedido`,
                  "Precio al por mayor fijo, sin sorpresas",
                  "Pides y sigues tu pedido desde el celular",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <Rombo className="size-4 shrink-0 text-oro" /> {t}
                  </li>
                ))}
              </ul>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl border border-cana/20 px-4 font-semibold hover:border-oro hover:text-oro">
                  <MessageCircle className="size-5" aria-hidden /> Prefiero escribir por WhatsApp
                </a>
              )}
            </div>
            <SignupForm municipios={MUNICIPIOS} min={min} />
          </div>
        </section>
        <div className="trenza trenza-oro" aria-hidden />
      </main>

      <footer className="bg-noche text-cana/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <Wordmark dark />
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p className="flex items-center gap-1.5">
              <Smartphone className="size-4" aria-hidden /> Hecho a mano en Tuchín, Córdoba
            </p>
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-oro">
                {settings.contactEmail}
              </a>
            )}
          </div>
        </div>
      </footer>

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className="pb-safe fixed bottom-4 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#1f9d55] text-white shadow-xl transition hover:scale-105 active:scale-95"
        >
          <MessageCircle className="size-7" aria-hidden />
        </a>
      )}
    </div>
  );
}

function SectionHead({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-canela">
        <Rombo className="size-3.5" /> {kicker}
      </p>
      <h2 id={id} className="mt-3 max-w-2xl text-balance font-display text-4xl font-black leading-[1.05] sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-linea bg-card p-5">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <span className="text-canela" aria-hidden>
          {icon}
        </span>
        {title}
      </p>
      <p className="mt-1.5 leading-relaxed text-tinta-2">{children}</p>
    </div>
  );
}
