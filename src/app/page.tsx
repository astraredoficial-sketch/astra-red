import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <BrandMark />
        <Link
          href="/acceso?mode=login"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-muted hover:text-ink"
        >
          Ya tengo una cuenta
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-20 pt-10 text-center">
        <p className="rise text-xs uppercase tracking-[0.35em] text-astral">
          Fase 1 · Alpha
        </p>
        <h1 className="font-serif rise mt-4 max-w-2xl text-5xl leading-tight md:text-7xl">
          No es magia.
          <br />
          Es <span className="text-thread">sinastría</span>.
        </h1>
        <p className="rise mt-6 max-w-xl text-lg text-muted">
          AstraRed calcula tu carta natal y te ayuda a descubrir afinidades
          astrológicas: Sol, Luna, Ascendente y el hilo que a veces se enciende.
        </p>

        <div className="rise mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/acceso?mode=signup"
            className="glow-thread rounded-full bg-thread px-8 py-3.5 text-sm font-medium text-white"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/acceso?mode=login"
            className="rounded-full border border-white/15 px-8 py-3.5 text-sm text-ink hover:bg-white/5"
          >
            Ya tengo una cuenta
          </Link>
        </div>

        <Link
          href="/destinos"
          className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Explorar la experiencia
        </Link>

        <div className="mt-16 grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
          {[
            { k: "01", t: "Carta natal", d: "Fecha, hora y ciudad para conocer tu tríada." },
            { k: "02", t: "Destinos", d: "Descubre perfiles y compara afinidades." },
            { k: "03", t: "Hilo Rojo", d: "Explora los aspectos astrológicos entre dos cartas." },
          ].map((item) => (
            <div key={item.k} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-thread">{item.k}</div>
              <div className="mt-2 font-serif text-2xl">{item.t}</div>
              <p className="mt-2 text-sm text-muted">{item.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
