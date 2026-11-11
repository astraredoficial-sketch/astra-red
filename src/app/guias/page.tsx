import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Guías de astrología",
  description:
    "Guías prácticas para usar las herramientas de carta natal, sinastría, calendario astral, ciclos lunares y revolución solar de AstraRed.",
  path: "/guias",
});

const guides = [
  {
    title: "Cómo usar tu carta natal",
    href: "/guias/carta-natal",
    description:
      "Explora tu rueda, el Sol, la Luna, el Ascendente, las casas y los aspectos.",
  },
  {
    title: "Cómo usar el calendario astral",
    href: "/guias/calendario-lunar",
    description:
      "Consulta tu cielo de hoy, explora fases y guarda fechas para planificar con intención.",
  },
  {
    title: "Cómo calcular una sinastría",
    href: "/guias/sinastria",
    description:
      "Compara dos cartas, revisa los aspectos y entiende los límites de la puntuación.",
  },
  {
    title: "Destinos astrales y Hilo Rojo",
    href: "/guias/destinos-astrales",
    description:
      "Explora perfiles compatibles, expresa interés y entiende cuándo hay una conexión mutua.",
  },
  {
    title: "Cómo consultar tu ciclo personal",
    href: "/guias/ciclo-personal",
    description:
      "Usa el retorno lunar como referencia para una pausa de reflexión y cuidado cotidiano.",
  },
  {
    title: "Cómo consultar la revolución solar",
    href: "/guias/revolucion-solar",
    description:
      "Calcula el retorno anual del Sol y explora su carta como lectura simbólica.",
  },
  {
    title: "Cómo usar la rectificación de hora natal",
    href: "/guias/rectificacion-natal",
    description:
      "Compara horas natales candidatas con acontecimientos importantes y fechados de tu vida.",
  },
];

export default function GuidesPage() {
  return (
    <PublicDocument
      eyebrow="AstraRed · Guías"
      title="Guías para usar las herramientas de AstraRed"
      introduction="Instrucciones para explorar cartas y ciclos astrales, comparar afinidades y aprovechar cada herramienta con curiosidad, criterio y cuidado de tus datos."
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
