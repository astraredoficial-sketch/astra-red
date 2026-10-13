import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const featureCards = [
  { k: "01", t: "Carta natal", d: "Conoce tu Sol, Luna y Ascendente a partir de tu nacimiento." },
  { k: "02", t: "Afinidades", d: "Descubre perfiles y compara la compatibilidad entre cartas." },
  { k: "03", t: "Hilo Rojo", d: "Explora los aspectos y conexiones entre dos cartas natales." },
  { k: "04", t: "Mensajes", d: "Continúa la conversación cuando existe una conexión mutua." },
];

export default function Home() {
  return (
    <div className="starfield starfield-home flex min-h-screen flex-col overflow-hidden bg-[#07060c] text-ink">
      <div className="constellation-layer" aria-hidden="true" />
      <div className="shooting-star" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <BrandMark />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-20 pt-6 text-center sm:px-8">
        <div className="orbital-ring relative flex w-full max-w-[860px] items-center justify-center py-8 sm:py-12">
          <div className="relative z-10 flex max-w-[620px] flex-col items-center px-4 text-center">
            <h1 className="font-serif rise text-[4.2rem] leading-[0.9] tracking-[-0.04em] text-white sm:text-[6rem] md:text-[7.2rem]">
              No es magia.
              <br />
              Es <span className="text-thread">sinastría</span>.
            </h1>

            <p className="rise mt-7 max-w-[650px] text-sm leading-7 text-[#d2c8dc] sm:text-lg sm:leading-8">
              Descubre lo que tu carta natal revela de ti, conecta con personas
              afines y consulta tu calendario astral para encontrar el momento
              propicio para cada intención.
            </p>

            <div className="rise mt-5 flex max-w-[590px] flex-col items-center">
              <span aria-hidden="true" className="mb-4 h-px w-12 bg-gradient-to-r from-transparent via-thread/80 to-transparent" />
              <p className="font-serif text-xl italic leading-7 text-[#f0d9e2] sm:text-2xl sm:leading-8">
                Hay conexiones que parecen escritas en las estrellas. Descubre
                quién podría estar al otro lado de tu hilo rojo.
              </p>
            </div>

            <div className="rise mt-7 flex w-full max-w-[420px] flex-col items-center gap-3">
              <Link
                href="/acceso?mode=signup"
                className="glow-thread inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff476f] to-[#ff2b7d] px-7 py-4 text-base font-medium text-white shadow-[0_0_24px_rgba(255,42,95,0.45)] transition hover:scale-[1.01]"
              >
                Crear cuenta GRATIS
              </Link>

              <Link
                href="/acceso?mode=login"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-ink/80 transition hover:border-white/25 hover:text-white"
              >
                Ya tengo una cuenta
              </Link>
            </div>
          </div>
        </div>

        <section aria-labelledby="features-title" className="mt-6 w-full max-w-4xl">
          <h2 id="features-title" className="sr-only">Características de AstraRed</h2>
          <div className="grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((item) => (
            <div
              key={item.k}
              className="feature-card rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
            >
              <div className="text-xs font-medium tracking-[0.2em] text-thread">{item.k}</div>
              <h3 className="mt-3 font-serif text-[2rem] leading-none text-white">{item.t}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{item.d}</p>
            </div>
          ))}
          </div>
        </section>

        <section
          aria-labelledby="calendar-title"
          className="calendar-preview mt-5 grid w-full max-w-4xl gap-6 rounded-[28px] border border-white/10 p-5 text-left sm:grid-cols-[0.9fr_1.1fr] sm:items-center sm:p-7"
        >
          <div
            aria-hidden="true"
            className="calendar-window rounded-2xl border border-white/10 bg-[#0b0a11]/90 p-4 shadow-[0_15px_50px_rgba(0,0,0,0.35)]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-muted">CALENDARIO ASTRAL</span>
              <span className="text-[10px] text-muted">VISTA DE EJEMPLO</span>
            </div>
            <div className="space-y-2">
              {[
                { day: "12 MAY", title: "Luna creciente", note: "Buen momento para iniciar", color: "bg-thread" },
                { day: "18 MAY", title: "Venus en armonía", note: "Día favorable para vínculos", color: "bg-astral" },
                { day: "24 MAY", title: "Cuarto menguante", note: "Cierra ciclos con intención", color: "bg-sky-400" },
              ].map((event) => (
                <div key={event.day} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${event.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/90">{event.title}</p>
                    <p className="truncate text-[10px] text-muted">{event.note}</p>
                  </div>
                  <span className="shrink-0 text-[9px] tracking-wider text-muted">{event.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-thread">05 · Calendario astral</p>
            <h2 id="calendar-title" className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl">
              Sincroniza tus momentos importantes
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Consulta fases lunares y recomendaciones astrales para planificar
              relaciones, trabajo, hogar y otros proyectos. Esta vista es una
              muestra visual de la experiencia.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
