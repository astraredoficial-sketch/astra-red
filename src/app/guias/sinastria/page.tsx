import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo calcular una sinastría",
  description:
    "Guía para calcular una sinastría en AstraRed, revisar aspectos entre dos cartas y compartir el informe con criterio.",
  path: "/guias/sinastria",
  type: "article",
});

export default function SynastryGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Afinidades"
      title="Cómo calcular una sinastría"
      introduction="La herramienta de sinastría de AstraRed compara dos cartas y presenta una puntuación, contactos planetarios y una lectura temática. Esta guía explica qué necesitas y cómo entender el resultado."
    >
      <section>
        <h2>1. Prepara los datos con consentimiento</h2>
        <p>
          Inicia sesión y abre <Link href="/sinastria">Sinastría</Link>. Para
          calcular, escribe un nombre que te ayude a identificar el informe y
          la fecha de nacimiento de la otra persona; elige su ciudad de
          nacimiento y, si la conoces, añade la hora. Pide permiso antes de
          introducir datos de nacimiento de otra persona.
        </p>
        <p>
          La hora es opcional. Si no la conoces, la herramienta usa una
          referencia aproximada y omite del análisis los contactos que dependen
          de la Luna y el Ascendente.
        </p>
      </section>
      <section>
        <h2>2. Calcula y revisa los aspectos</h2>
        <p>
          Selecciona “Calcular y guardar sinastría”. El resultado incluye una
          puntuación comparativa, aspectos planetarios entre ambas cartas y una
          lectura simbólica por áreas. Puedes abrir el detalle, revisar los
          contactos destacados y consultar el historial de informes de tu
          cuenta.
        </p>
        <p>
          El historial guarda el nombre de referencia y el resultado, pero no
          la fecha, la hora ni la localidad que introdujiste para el cálculo.
          Solo tú puedes ver y eliminar las entradas de tu historial. Si
          compartes un PDF o un resumen, revisa el contenido y el destinatario
          antes de enviarlo.
        </p>
      </section>
      <section>
        <h2>Una puntuación no define una relación</h2>
        <p>
          La puntuación resume aspectos calculados entre las cartas según el
          método de AstraRed. No representa una probabilidad, una evaluación
          científica ni una medida del valor de las personas. No puede
          determinar si una relación será sana, duradera o compatible en la vida
          real.
        </p>
      </section>
      <section>
        <h2>Por qué importan la hora y el lugar</h2>
        <p>
          La fecha, hora y ciudad permiten calcular posiciones y casas de la
          carta. Si la hora es desconocida, algunas posiciones —como el
          Ascendente y la Luna— pueden no estar disponibles en la comparación.
          Reconoce esa limitación en vez de asumir exactitud.
        </p>
      </section>
      <section>
        <h2>Una herramienta para conversar</h2>
        <p>
          Usa coincidencias o diferencias como punto de partida para hablar
          sobre necesidades, expectativas, límites y comunicación. La
          interpretación es simbólica, no prueba que dos personas estén
          destinadas a estar juntas.
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
        <Link href="/guias/carta-natal">carta natal</Link>. Si quieres conocer
        perfiles y expresar interés, consulta la guía de{" "}
        <Link href="/guias/destinos-astrales">Destinos astrales y Hilo Rojo</Link>.
      </p>
      <p>
        <Link href="/privacidad">Consulta la política de privacidad</Link> y
        crea una cuenta para usar la herramienta.
      </p>
    </PublicDocument>
  );
}
