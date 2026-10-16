import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { HomeSessionRedirect } from "@/components/HomeSessionRedirect";

const features = [
  {
    number: "01",
    title: "Carta natal",
    description: "Comprende tu Sol, Luna y Ascendente.",
  },
  {
    number: "02",
    title: "Afinidades",
    description: "Explora conexiones a partir de dos cartas.",
  },
  {
    number: "03",
    title: "Hilo Rojo",
    description: "Reconoce cuándo una afinidad es mutua.",
  },
  {
    number: "04",
    title: "Calendario astral",
    description: "Consulta ciclos lunares y fechas con intención.",
  },
  {
    number: "05",
    title: "Mensajes",
    description: "Conversa cuando existe interés mutuo.",
  },
];

const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "AstraRed",
      url: "https://astrared.vip",
      logo: "https://astrared.vip/astrared-logo.png",
    },
    {
      "@type": "WebSite",
      name: "AstraRed",
      url: "https://astrared.vip",
      inLanguage: "es",
    },
  ],
};

export const metadata: Metadata = {
  title: "AstraRed | Carta natal, sinastría y calendario astral",
  description:
    "Explora tu carta natal, descubre afinidades y consulta un calendario astral para vivir tus decisiones con intención.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "AstraRed | Conexiones bajo otra mirada",
    description:
      "Carta natal, afinidades y calendario astral en un espacio pensado para conocerte mejor.",
    url: "https://astrared.vip/",
    siteName: "AstraRed",
    locale: "es_VE",
    type: "website",
    images: ["/astrared-social.png"],
  },
};

export default function Home() {
  return (
    <div className="starfield starfield-home flex min-h-screen flex-col overflow-hidden bg-[#07060c] text-ink">
      <HomeSessionRedirect />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-6 sm:px-8">
        <BrandMark />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-14 pt-5 sm:px-8 sm:pt-8">
        <section
          aria-labelledby="hero-title"
          className="flex w-full max-w-4xl flex-col items-center py-8 text-center sm:py-12"
        >
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-thread">
            Conócete. Conecta. Elige tu momento.
          </p>
          <h1
            id="hero-title"
            className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.035em] text-white sm:text-7xl"
          >
            No es magia.
            <br />
            Es <span className="text-thread">sinastría.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#d2c8dc] sm:text-lg sm:leading-8">
            Descubre lo que revela tu carta natal, conecta con personas afines y
            consulta tu calendario astral para encontrar el momento indicado
            para cada intención.
          </p>
          <p className="mt-4 max-w-xl font-serif text-xl italic leading-7 text-[#f0d9e2] sm:text-2xl">
            Hay conexiones que parecen escritas en las estrellas. Descubre quién
            podría estar al otro lado de tu Hilo Rojo.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3">
            <Link
              href="/acceso?mode=signup"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-thread px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-[#e61f53] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Crear una cuenta
            </Link>
            <Link
              href="/acceso?mode=login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Ya tengo una cuenta
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Para personas mayores de 18 años · Un mes promocional de
            inauguración sin costo
          </p>
        </section>

        <section
          aria-labelledby="features-title"
          className="mt-5 w-full border-t border-white/10 pt-8"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-thread">
                Una mirada más amplia
              </p>
              <h2
                id="features-title"
                className="mt-2 font-serif text-3xl text-white sm:text-4xl"
              >
                Lo que puedes explorar
              </h2>
            </div>
            <span className="text-xs text-muted">
              Herramientas para explorar y conectar
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="feature-card rounded-2xl border border-white/10 p-4"
              >
                <span className="text-xs font-medium tracking-[0.18em] text-thread">
                  {feature.number}
                </span>
                <h3 className="mt-2 font-serif text-2xl leading-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-5 text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="calendar-title"
          className="calendar-preview mt-4 grid w-full gap-5 rounded-3xl border border-white/10 p-4 text-left sm:grid-cols-[1fr_1fr] sm:items-center sm:p-6"
        >
          <div
            aria-label="Muestra ilustrativa de calendario astral"
            className="calendar-window rounded-2xl border border-white/10 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-muted">
                CALENDARIO ASTRAL
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-muted">
                MUESTRA
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  day: "12 MAY",
                  title: "Luna creciente",
                  note: "Una pausa para sembrar intenciones",
                  color: "bg-thread",
                },
                {
                  day: "18 MAY",
                  title: "Venus en armonía",
                  note: "Un momento para cuidar los vínculos",
                  color: "bg-astral",
                },
                {
                  day: "24 MAY",
                  title: "Cuarto menguante",
                  note: "Tiempo de revisar y soltar",
                  color: "bg-sky-400",
                },
              ].map((event) => (
                <div
                  key={event.day}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${event.color}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/90">
                      {event.title}
                    </p>
                    <p className="truncate text-[10px] text-muted">
                      {event.note}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] tracking-wider text-muted">
                    {event.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-thread">
              Un ciclo a la vez
            </p>
            <h2
              id="calendar-title"
              className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl"
            >
              Tu calendario, con otra perspectiva.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Una vista de ejemplo de las fases lunares y las fechas que podrás
              consultar en AstraRed. Es una referencia simbólica, no una
              predicción.
            </p>
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </div>
  );
}
