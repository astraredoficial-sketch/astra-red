import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo consultar la revolución solar",
  description:
    "Aprende a calcular la revolución solar en AstraRed, leer su carta anual y reconocer los límites de la interpretación.",
  path: "/guias/revolucion-solar",
  type: "article",
});

export default function SolarReturnGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Carta natal"
      title="Cómo consultar la revolución solar"
      introduction="La herramienta de revolución solar calcula el momento anual en que el Sol vuelve a la longitud de tu carta natal y presenta una carta para tu lugar de nacimiento. La lectura es simbólica: no predice cómo será tu año."
    >
      <section>
        <h2>1. Revisa tus datos de nacimiento</h2>
        <p>
          Inicia sesión y confirma que tu perfil tenga fecha, hora —si la
          conoces— y lugar de nacimiento. La herramienta toma de tu cuenta las
          coordenadas y la zona horaria natal para calcular el retorno y levantar
          la carta en ese lugar.
        </p>
      </section>
      <section>
        <h2>2. Elige el año y calcula el retorno</h2>
        <p>
          Desde Carta natal abre{" "}
          <Link href="/revolucion-solar">Revolución solar</Link>, selecciona
          un año entre 1900 y 2200 y pulsa “Calcular revolución”. El resultado
          muestra la fecha y hora local del retorno, la carta levantada para tu
          lugar natal y las posiciones planetarias por signo y casa.
        </p>
      </section>
      <section>
        <h2>3. Lee las áreas como preguntas de reflexión</h2>
        <p>
          La lectura organiza temas de dirección del ciclo, vínculos y afectos,
          trabajo y recursos, bienestar cotidiano y crecimiento. Cada sección
          combina posiciones de la carta con una pregunta para ayudarte a
          reflexionar; no constituye una predicción ni promete resultados
          profesionales, económicos o personales.
        </p>
      </section>
      <section>
        <h2>Si no conoces la hora de nacimiento</h2>
        <p>
          AstraRed usa el mediodía local como referencia y marca el resultado
          como aproximado. El instante y las posiciones que dependen de la hora
          pueden variar; no lo tomes como una hora natal confirmada. Si tienes
          un intervalo posible, revisa la{" "}
          <Link href="/guias/rectificacion-natal">
            guía de rectificación de hora natal
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Una lectura simbólica, no asesoramiento</h2>
        <p>
          La astrología no cuenta con validación científica para predecir
          acontecimientos. La revolución solar no debe reemplazar tu criterio
          ni la orientación médica, psicológica, financiera o profesional que
          puedas necesitar.
        </p>
      </section>
      <p>
        Consulta también cómo leer tu{" "}
        <Link href="/guias/carta-natal">carta natal</Link> y cómo se tratan los
        datos de nacimiento en la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
