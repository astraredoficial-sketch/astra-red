import type { Metadata } from "next";
import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Guías de astrología",
  description:
    "Guías breves para entender la carta natal, el calendario lunar y la sinastría desde una perspectiva simbólica.",
  alternates: { canonical: "/guias" },
  robots: { index: true, follow: true },
};

const guides = [
  {
    title: "Cómo empezar a leer tu carta natal",
    href: "/guias/carta-natal",
    description:
      "Una introducción al Sol, la Luna y el Ascendente, y a cómo leerlos en conjunto.",
  },
  {
    title: "Fases lunares y calendario astral",
    href: "/guias/calendario-lunar",
    description:
      "Qué significa cada fase y cómo usar un calendario como herramienta de reflexión.",
  },
  {
    title: "Qué es la sinastría",
    href: "/guias/sinastria",
    description:
      "Una mirada simbólica a la comparación de cartas y a las afinidades entre personas.",
  },
];

export default function GuidesPage() {
  return (
    <PublicDocument
      eyebrow="AstraRed · Guías"
      title="Astrología para explorar con curiosidad"
      introduction="Ideas prácticas para acercarte a tu carta natal, los ciclos lunares y la sinastría, sin fórmulas mágicas ni promesas absolutas."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-thread/50 hover:bg-white/[0.06]"
          >
            <h2>{guide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {guide.description}
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-thread">
              Leer la guía
            </span>
          </Link>
        ))}
      </div>
      <p className="text-sm leading-6 text-muted">
        La astrología se aborda aquí como una tradición simbólica para la
        reflexión personal, no como una disciplina científica.
      </p>
    </PublicDocument>
  );
}
