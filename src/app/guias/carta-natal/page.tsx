import type { Metadata } from "next";
import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Cómo empezar a leer tu carta natal",
  description:
    "Conoce el papel del Sol, la Luna y el Ascendente en una carta natal y cómo interpretarlos como un conjunto simbólico.",
  alternates: { canonical: "/guias/carta-natal" },
  robots: { index: true, follow: true },
};

export default function NatalChartGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Carta natal"
      title="Cómo empezar a leer tu carta natal"
      introduction="Una carta natal es una representación simbólica del cielo para una fecha, hora y lugar de nacimiento. Puedes comenzar por tres puntos conocidos: Sol, Luna y Ascendente."
    >
      <section>
        <h2>El Sol: una identidad en desarrollo</h2>
        <p>
          En astrología, el signo solar suele relacionarse con la identidad, la
          vitalidad y la manera de expresar propósito. Es una puerta de entrada,
          no un resumen completo de una persona.
        </p>
      </section>
      <section>
        <h2>La Luna: necesidades y mundo emocional</h2>
        <p>
          La Luna se interpreta como una imagen de necesidades emocionales,
          hábitos y formas de buscar seguridad. La hora exacta de nacimiento
          puede ser importante cuando se calculan casas y posiciones próximas a
          un cambio de signo.
        </p>
      </section>
      <section>
        <h2>El Ascendente: el comienzo de las casas</h2>
        <p>
          El Ascendente es el signo que ascendía por el horizonte oriental en el
          momento y lugar de nacimiento. Como depende mucho de la hora, una hora
          desconocida puede limitar su cálculo.
        </p>
      </section>
      <section>
        <h2>Lee la tríada en conjunto</h2>
        <p>
          En lugar de etiquetarte por un solo signo, observa cómo las tres
          posiciones conversan entre sí y qué preguntas te despiertan. La carta
          puede servir como lenguaje de reflexión; no determina tu personalidad
          ni tu futuro.
        </p>
      </section>
      <p>
        Si quieres comparar dos cartas, continúa con nuestra guía sobre{" "}
        <Link href="/guias/sinastria">qué es la sinastría</Link>.
      </p>
    </PublicDocument>
  );
}
