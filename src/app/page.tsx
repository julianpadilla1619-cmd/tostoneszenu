import Link from "next/link";
import { ArrowRight, BellRing, CalendarCheck, Flame, PackageCheck, Smartphone, Store, Truck, UserPlus } from "lucide-react";
import { Logo, ProductArt, Rombo, Wordmark } from "@/components/brand/Brand";
import { SignupForm } from "@/components/cliente/SignupForm";
import { money } from "@/lib/format";
import { products, settings } from "@/lib/mock-data";

const pasos = [
  { n: "01", icon: UserPlus, t: "Llena la solicitud", d: "Nos dejas tu nombre, celular, municipio y cuántos paquetes mueves más o menos por semana." },
  { n: "02", icon: CalendarCheck, t: "Te activamos la cuenta", d: "Te escribimos por WhatsApp, te damos tu precio (regular o mayorista) y tu usuario para entrar." },
  { n: "03", icon: PackageCheck, t: "Pides cada semana", d: "Entras desde el celular, marcas cuántos paquetes quieres —o “esta semana no”— y el sábado te llega." },
];

const semana = [
  { d: "Lun", t: "Abren pedidos", tone: "oro" },
  { d: "Mar", t: "", tone: "oro" },
  { d: "Mié", t: "", tone: "oro" },
  { d: "Jue", t: "Corte 6 p. m.", tone: "corte" },
  { d: "Vie", t: "Producción", tone: "fuego" },
  { d: "Sáb", t: "Entrega", tone: "entrega" },
  { d: "Dom", t: "Descanso", tone: "off" },
] as const;

const faqs = [
  { q: "¿Cuál es el pedido mínimo?", a: `Los clientes regulares pueden pedir desde 1 paquete. Los mayoristas, desde ${settings.wholesaleMinPacks} paquetes a la semana para mantener el precio mayorista.` },
  { q: "¿Hasta cuándo puedo pedir?", a: "Hasta el jueves a las 6:00 p. m. Después de esa hora el pedido queda cerrado porque arrancamos a comprar el plátano y a fritar." },
  { q: "¿A dónde entregan?", a: "Tuchín, San Andrés de Sotavento, Chinú, Sahagún, Lorica, Momil, Ciénaga de Oro y Montería. Si estás en otro municipio, escríbenos y lo cuadramos." },
  { q: "¿Cómo pago?", a: "Efectivo contra entrega, Nequi, Daviplata o transferencia." },
  { q: "¿Tengo que instalar algo?", a: "No es obligatorio. La app abre desde el navegador, pero puedes agregarla a la pantalla de inicio y te avisamos por notificación cuando toque pedir." },
];

export default function Landing() {
  return (
    <div className="tema-claro bg-fondo text-tinta">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 border-b border-oro/15 bg-noche/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Inicio">
            <Logo size={40} priority />
            <Wordmark dark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-cana/75 md:flex">
            <a href="#productos" className="hover:text-oro">Productos</a>
            <a href="#como" className="hover:text-oro">Cómo ser cliente</a>
            <a href="#semana" className="hover:text-oro">La semana</a>
            <a href="#preguntas" className="hover:text-oro">Preguntas</a>
          </nav>
          <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-xl bg-oro px-4 text-sm font-bold text-noche transition hover:bg-oro-claro active:scale-95">
            Entrar
          </Link>
        </div>
      </header>

      {/* Héroe */}
      <section className="grano relative overflow-hidden bg-noche text-cana">
        <div className="rombos-oscuro absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_.9fr] md:pb-24 md:pt-16">
          <div className="animate-subir">
            <p className="inline-flex items-center gap-2 rounded-full border border-oro/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-oro">
              <Rombo className="size-3.5" /> Desde Tuchín, Córdoba
            </p>
            <h1 className="mt-5 font-display text-[2.7rem] font-black leading-[0.98] sm:text-6xl lg:text-7xl">
              El tostón que <br className="hidden sm:block" />
              se pide <em className="font-black text-oro not-italic underline decoration-toston decoration-[6px] underline-offset-[10px]">por semana</em>.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cana/75">
              Tostones de plátano y papas fritas hechos a mano, al por mayor. Tú marcas tu pedido desde el celular y el sábado lo tienes en tu negocio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#solicitud" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-oro px-6 font-bold text-noche shadow-[var(--shadow-oro)] transition hover:bg-oro-claro active:scale-[.97]">
                Quiero ser cliente <ArrowRight className="size-5" />
              </a>
              <Link href="/login" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cana/20 px-6 font-semibold text-cana transition hover:border-oro hover:text-oro">
                Ya soy cliente · Entrar
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-cana/10 pt-6 text-sm">
              {[
                ["Pide hasta", "Jueves 6 p. m."],
                ["Entrega", "Sábados"],
                ["Mayorista", `desde ${settings.wholesaleMinPacks} paq.`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-cana/50">{k}</dt>
                  <dd className="mt-1 font-display text-base font-bold text-oro-claro">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto grid aspect-square w-full max-w-[420px] place-items-center">
            <div className="absolute inset-0 animate-girar rounded-full border-2 border-dashed border-oro/25" />
            <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgb(217_169_58/.28),transparent_65%)]" />
            <Rombo className="absolute left-0 top-1/2 size-8 -translate-y-1/2 text-cafe" />
            <Rombo className="absolute right-0 top-1/2 size-8 -translate-y-1/2 text-cafe" />
            <div className="animate-flotar">
              <Logo size={340} priority className="drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]" />
            </div>
          </div>
        </div>
      </section>
      <div className="trenza" aria-hidden />

      {/* Productos */}
      <section id="productos" className="rombos scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHead kicker="Lo que hacemos" title="Dos productos, hechos bien." />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {products.map((p, i) => (
              <article key={p.id} className="group relative overflow-hidden rounded-[1.75rem] border border-linea bg-card p-6 shadow-[var(--shadow-calida)] transition hover:-translate-y-1" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="flex items-start gap-5">
                  <ProductArt kind={p.kind} className="size-28 shrink-0 transition duration-500 group-hover:rotate-6 sm:size-32" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-canela">{p.presentation}</p>
                    <h3 className="mt-1 font-display text-2xl font-black sm:text-3xl">{p.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-tinta-2">
                      {p.kind === "toston"
                        ? "Plátano hartón de la región, cortado grueso, doble fritura y su punto de sal. Crocante de verdad."
                        : "Papa criolla en bastón, frita en aceite limpio cada semana. Para la tienda, el kiosko o el estadero."}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-dashed border-linea pt-5">
                  <div>
                    <p className="text-xs text-tinta-2">Precio regular</p>
                    <p className="tabular font-display text-xl font-bold">{money(p.priceRegular)}</p>
                  </div>
                  <div className="rounded-2xl bg-noche px-4 py-2 text-cana">
                    <p className="text-xs text-oro">Precio mayorista</p>
                    <p className="tabular font-display text-xl font-bold text-oro-claro">{money(p.priceWholesale)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-tinta-2">Precios de referencia por paquete. Pueden variar según volumen y municipio.</p>
        </div>
      </section>

      {/* Cómo ser cliente */}
      <section id="como" className="scroll-mt-16 border-y border-linea bg-card-2/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHead kicker="Cómo ser cliente" title="Tres pasos y ya estás pidiendo." />
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {pasos.map((p) => (
              <li key={p.n} className="relative">
                <span className="font-display text-7xl font-black leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-canela)]">{p.n}</span>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-noche text-oro">
                    <p.icon className="size-5" />
                  </span>
                  <h3 className="font-display text-xl font-bold">{p.t}</h3>
                </div>
                <p className="mt-2 leading-relaxed text-tinta-2">{p.d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Tipo
              icon={<Smartphone className="size-6" />}
              title="Cliente regular"
              items={["Pides desde 1 paquete", "Precio regular", "Ideal para kioskos, cafeterías y casas", "Recordatorio semanal en el celular"]}
            />
            <Tipo
              dark
              icon={<Store className="size-6" />}
              title="Cliente mayorista"
              items={[`Desde ${settings.wholesaleMinPacks} paquetes por semana`, "Precio mayorista (hasta 20 % menos)", "Entrega prioritaria los sábados", "Historial y cuentas claras en la app"]}
            />
          </div>
        </div>
      </section>

      {/* La semana */}
      <section id="semana" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHead kicker="Así trabajamos" title="Una semana Zenú." />
          <div className="scroll-x -mx-4 mt-10 overflow-x-auto px-4">
            <ol className="grid min-w-[640px] grid-cols-7 gap-2">
              {semana.map((s) => (
                <li
                  key={s.d}
                  className={
                    "flex h-36 flex-col justify-between rounded-2xl p-3 " +
                    (s.tone === "oro"
                      ? "bg-oro/25"
                      : s.tone === "corte"
                        ? "bg-noche text-oro"
                        : s.tone === "fuego"
                          ? "bg-toston"
                          : s.tone === "entrega"
                            ? "bg-cafe text-cana"
                            : "border border-dashed border-linea text-tinta-2")
                  }
                >
                  <span className="font-display text-2xl font-black">{s.d}</span>
                  <span className="flex items-end gap-1 text-sm font-semibold leading-tight">
                    {s.tone === "fuego" && <Flame className="size-4 shrink-0" />}
                    {s.tone === "entrega" && <Truck className="size-4 shrink-0" />}
                    {s.t}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-linea bg-card p-4 text-sm">
            <BellRing className="mt-0.5 size-5 shrink-0 text-canela" />
            <p className="text-tinta-2">
              <b className="text-tinta">El jueves a las 10 a. m.</b> te llega un recordatorio si todavía no has pedido. Y el sábado te avisamos cuando tu pedido va en camino.
            </p>
          </div>
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="scroll-mt-16 border-t border-linea bg-card-2/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[.8fr_1.2fr] md:py-24">
          <SectionHead kicker="Preguntas" title="Lo que siempre nos preguntan." />
          <div className="divide-y divide-linea rounded-[1.5rem] border border-linea bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-card-2 text-lg transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 leading-relaxed text-tinta-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Solicitud */}
      <section id="solicitud" className="tema-oscuro grano relative scroll-mt-16 overflow-hidden bg-noche text-cana">
        <div className="rombos-oscuro absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-oro">Solicitud</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">¿Quieres vender Tostones Zenú?</h2>
            <p className="mt-4 max-w-md text-lg text-cana/70">Déjanos tus datos. Te escribimos por WhatsApp en menos de 24 horas para activarte.</p>
            <div className="mt-8 hidden md:block">
              <Logo size={160} className="opacity-90" />
            </div>
          </div>
          <SignupForm />
        </div>
      </section>
      <div className="trenza trenza-oro" aria-hidden />

      <footer className="bg-noche text-cana/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <Wordmark dark />
          </div>
          <p>Hecho con orgullo zenú en Tuchín, Córdoba · © 2026</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-canela">
        <Rombo className="size-3.5" /> {kicker}
      </p>
      <h2 className="mt-3 max-w-2xl font-display text-4xl font-black leading-[1.05] sm:text-5xl">{title}</h2>
    </div>
  );
}

function Tipo({ title, items, icon, dark }: { title: string; items: string[]; icon: React.ReactNode; dark?: boolean }) {
  return (
    <div className={"rounded-[1.75rem] p-6 " + (dark ? "bg-noche text-cana" : "border border-linea bg-card")}>
      <div className="flex items-center gap-3">
        <span className={"grid size-11 place-items-center rounded-2xl " + (dark ? "bg-oro text-noche" : "bg-noche text-oro")}>{icon}</span>
        <h3 className="font-display text-2xl font-black">{title}</h3>
      </div>
      <ul className="mt-5 space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-3">
            <Rombo className={"size-4 shrink-0 " + (dark ? "text-oro" : "text-canela")} />
            <span className={dark ? "text-cana/85" : "text-tinta-2"}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
