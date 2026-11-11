import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo usar y leer tu carta natal",
  description:
    "Aprende a consultar la carta natal de AstraRed, leer el Sol, la Luna, el Ascendente, casas y aspectos, y compartir tu informe.",
  path: "/guias/carta-natal",
  type: "article",
});

export default function NatalChartGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Carta natal"
      title="Cómo usar y leer tu carta natal"
      introduction="La herramienta Carta natal de AstraRed presenta una representación simbólica del cielo para tus datos de nacimiento. Esta guía explica dónde consultar tu carta, qué muestra y cómo leerla sin reducirla a una etiqueta."
    >
      <section>
        <h2>Abre tu carta</h2>
        <p>
          Inicia sesión y entra en{" "}
          <Link href="/carta">Carta natal</Link>. La herramienta usa los datos
          de nacimiento asociados a tu cuenta para mostrar la rueda, las
          posiciones planetarias, las casas, los aspectos y una lectura de
          Sol, Luna y Ascendente. Si aún no tienes datos de nacimiento en tu
          perfil, complétalos desde tu cuenta antes de continuar.
        </p>
      </section>
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
        <p>
          Como ejercicio, puedes preguntarte qué temas asocias con tu identidad
          (Sol), qué necesitas para sentir seguridad (Luna) y cómo te acercas a
          situaciones nuevas (Ascendente), sin tomar esas asociaciones como
          rasgos comprobados.
        </p>
      </section>
      <section>
        <h2>Hora desconocida y carta para compartir</h2>
        <p>
          Si no conoces tu hora de nacimiento, AstraRed utiliza el mediodía
          como referencia y lo indica en la carta. En ese caso, la Luna, el
          Ascendente y las casas pueden variar; toma esas posiciones con
          cautela. Si conoces un intervalo posible, puedes explorar la{" "}
          <Link href="/guias/rectificacion-natal">
            guía de rectificación de hora natal
          </Link>
          .
        </p>
        <p>
          Puedes descargar tu carta en PDF o compartirla. El PDF de la carta
          natal no incluye tu fecha, hora ni lugar de nacimiento; aun así,
          revisa cualquier archivo antes de enviarlo.
        </p>
      </section>
      <p>
        Para comparar dos cartas, consulta{" "}
        <Link href="/guias/sinastria">la guía de sinastría</Link>. También
        puedes explorar la{" "}
        <Link href="/guias/revolucion-solar">revolución solar</Link> y el{" "}
        <Link href="/guias/ciclo-personal">ciclo personal lunar</Link>.
      </p>
      <p>
        <Link href="/acceso?mode=signup">Crea tu cuenta en AstraRed</Link>{" "}
        y conoce cómo se tratan tus datos de nacimiento en la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
