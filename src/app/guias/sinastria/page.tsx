import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Qué es la sinastría",
  description:
    "Una introducción a la sinastría: cómo se comparan dos cartas natales y qué puede aportar una lectura astrológica de afinidad.",
  path: "/guias/sinastria",
  type: "article",
});

export default function SynastryGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Afinidades"
      title="Qué es la sinastría"
      introduction="La sinastría compara dos cartas natales para explorar, desde la astrología, puntos de armonía, diferencias y temas que pueden abrir una conversación."
    >
      <section>
        <h2>Comparar no es predecir</h2>
        <p>
          Una lectura puede señalar cómo ciertas posiciones se relacionan según
          una tradición astrológica. No puede determinar si una relación será
          sana, duradera o compatible en la vida real. Para eso importan la
          comunicación, el respeto, los límites y las decisiones de cada
          persona.
        </p>
      </section>
      <section>
        <h2>Por qué importan la hora y el lugar</h2>
        <p>
          La fecha, hora y ciudad permiten calcular posiciones y casas de la
          carta. Si la hora es desconocida, algunas partes —como el Ascendente y
          las casas— pueden ser menos precisas o no estar disponibles. Conviene
          reconocer esa limitación en vez de asumir exactitud.
        </p>
      </section>
      <section>
        <h2>Una herramienta para conocerse</h2>
        <p>
          Usa una comparación como punto de partida para hablar sobre
          necesidades, expectativas y diferencias, no como prueba de que dos
          personas están destinadas a estar juntas. La interpretación es
          simbólica y no constituye un resultado científico.
        </p>
      </section>
      <section>
        <h2>¿Cómo aprovechar una lectura de afinidad?</h2>
        <p>
          Toma cualquier coincidencia o diferencia como una pregunta para
          conversar: qué necesita cada persona, qué límites quiere cuidar y
          cómo prefiere comunicarse. La calidad de una relación depende de las
          decisiones y el trato mutuo, no de una puntuación astrológica.
        </p>
      </section>
      <p>
        Empieza por entender los tres puntos principales de tu{" "}
        <Link href="/guias/carta-natal">carta natal</Link>.
      </p>
      <p>
        <Link href="/acceso?mode=signup">Explora las funciones de AstraRed</Link>.
      </p>
    </PublicDocument>
  );
}
