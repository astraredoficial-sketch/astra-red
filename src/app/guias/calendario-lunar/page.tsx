import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Fases lunares y calendario astral",
  description:
    "Aprende qué representan las fases lunares y cómo consultar un calendario astral como guía simbólica para planificar con intención.",
  path: "/guias/calendario-lunar",
  type: "article",
});

export default function LunarCalendarGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Calendario astral"
      title="Fases lunares y calendario astral"
      introduction="La Luna pasa por un ciclo visible de fases. Un calendario astral reúne esas referencias con interpretaciones simbólicas para ayudarte a observar tus planes con otra perspectiva."
    >
      <section>
        <h2>¿Cuáles son las fases de la Luna?</h2>
        <p>
          En orden, las ocho fases son Luna nueva, Luna creciente, cuarto
          creciente, gibosa creciente, Luna llena, gibosa menguante, cuarto
          menguante y Luna menguante. Los cuatro hitos principales son la Luna
          nueva, los cuartos y la Luna llena.
        </p>
        <p>
          La{" "}
          <a href="https://science.nasa.gov/moon/moon-phases/">
            guía de NASA sobre las fases lunares
          </a>{" "}
          (en inglés) describe el ciclo astronómico; las asociaciones
          astrológicas son interpretaciones simbólicas distintas.
        </p>
      </section>
      <section>
        <h2>Usa el calendario como una pausa, no como una orden</h2>
        <p>
          Puedes anotar una intención, revisar cómo te sientes y decidir qué
          paso es realista para ti. Una fecha astrológica no garantiza un
          resultado ni reemplaza información práctica, asesoría profesional o
          tu propio criterio.
        </p>
      </section>
      <section>
        <h2>Una precisión importante</h2>
        <p>
          Las fechas exactas de las fases dependen del momento astronómico y de
          la zona horaria. Las recomendaciones astrológicas son interpretativas
          y pueden variar entre tradiciones.
        </p>
      </section>
      <p>
        Explora también cómo se comparan dos cartas en la guía sobre{" "}
        <Link href="/guias/sinastria">sinastría</Link>.
      </p>
      <p>
        <Link href="/acceso?mode=signup">Consulta el calendario astral</Link>.
      </p>
    </PublicDocument>
  );
}
