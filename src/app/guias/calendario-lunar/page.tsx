import type { Metadata } from "next";
import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Fases lunares y calendario astral",
  description:
    "Aprende qué representan las fases lunares y cómo consultar un calendario astral como guía simbólica para planificar con intención.",
  alternates: { canonical: "/guias/calendario-lunar" },
  robots: { index: true, follow: true },
};

export default function LunarCalendarGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Calendario astral"
      title="Fases lunares y calendario astral"
      introduction="La Luna pasa por un ciclo visible de fases. Un calendario astral reúne esas referencias con interpretaciones simbólicas para ayudarte a observar tus planes con otra perspectiva."
    >
      <section>
        <h2>Las fases, en breve</h2>
        <ul>
          <li>
            <strong>Luna nueva:</strong> la parte iluminada no es visible desde
            la Tierra; muchas tradiciones la asocian con comienzos y pausa.
          </li>
          <li>
            <strong>Cuarto creciente:</strong> aumenta la porción iluminada y se
            acerca la Luna llena.
          </li>
          <li>
            <strong>Luna llena:</strong> vemos su disco iluminado, una fase que
            algunas prácticas relacionan con culminación o revisión.
          </li>
          <li>
            <strong>Cuarto menguante:</strong> disminuye la porción visible
            mientras el ciclo avanza hacia la próxima Luna nueva.
          </li>
        </ul>
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
    </PublicDocument>
  );
}
