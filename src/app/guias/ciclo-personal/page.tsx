import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo consultar tu ciclo personal lunar",
  description:
    "Guía del Ciclo personal de AstraRed: retorno lunar, cuenta regresiva, reflexión de bienestar y reporte para compartir.",
  path: "/guias/ciclo-personal",
  type: "article",
});

export default function PersonalCycleGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Ciclo personal"
      title="Cómo consultar tu ciclo personal lunar"
      introduction="Ciclo personal calcula cuándo la Luna volverá aproximadamente a la longitud de tu Luna natal y ofrece ideas para hacer una pausa. Es una referencia astrológica simbólica, no una evaluación de salud ni una predicción."
    >
      <section>
        <h2>1. Abre tu ciclo personal</h2>
        <p>
          Inicia sesión y entra en{" "}
          <Link href="/ciclo-personal">Ciclo personal</Link>. La herramienta
          usa la posición lunar de tu carta natal para estimar la fecha y hora
          de tu próximo retorno, expresadas en la zona horaria local del
          dispositivo. La cuenta regresiva se actualiza mientras la página está
          abierta.
        </p>
      </section>
      <section>
        <h2>2. Interpreta el contador como una referencia</h2>
        <p>
          El porcentaje circular es orientativo: se aproxima usando la
          duración media de un ciclo lunar, no mide con precisión el avance
          astronómico de la Luna. Si desconoces tu hora natal, la posición
          lunar de referencia también puede ser aproximada.
        </p>
        <p>
          El análisis identifica el retorno a la longitud lunar natal. No
          calcula casas ni aspectos para ese momento; por eso la herramienta no
          presenta esas posiciones como si fueran un análisis completo.
        </p>
      </section>
      <section>
        <h2>3. Usa la ventana de cuidado como una pausa opcional</h2>
        <p>
          La ventana de 48 horas reúne sugerencias generales sobre hábitos,
          intimidad y vínculos, y descanso. Puedes recorrer los temas y tomar
          solo lo que te resulte útil. La ventana no predice cambios físicos o
          emocionales, ni indica que debas posponer una conversación o decisión.
        </p>
        <p>
          El contenido no sustituye orientación médica, psicológica ni
          profesional. Para decisiones de salud, busca asesoramiento
          cualificado y fuentes fiables.
        </p>
      </section>
      <section>
        <h2>4. Consulta, descarga o comparte el reporte</h2>
        <p>
          Abre “Ver análisis y reporte” para consultar la referencia del
          retorno y descargar un PDF con la fecha calculada, la zona horaria y
          una guía de reflexión. También puedes compartir la fecha del retorno.
          Revisa el contenido y el destinatario antes de enviar cualquier
          información.
        </p>
      </section>
      <p>
        Para consultar las fases de cada fecha y planificar intenciones,
        explora la guía del{" "}
        <Link href="/guias/calendario-lunar">calendario astral</Link>. Si
        quieres revisar la carta natal de otro año, consulta{" "}
        <Link href="/guias/revolucion-solar">revolución solar</Link>.
      </p>
      <p>
        Revisa cómo se manejan los datos de tu carta en la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
