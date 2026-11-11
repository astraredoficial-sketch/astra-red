import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo usar Destinos astrales y Hilo Rojo",
  description:
    "Aprende a explorar perfiles, expresar interés y entender la afinidad astrológica y las conexiones mutuas en AstraRed.",
  path: "/guias/destinos-astrales",
  type: "article",
});

export default function AstralDestinationsGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Afinidades y conexiones"
      title="Cómo usar Destinos astrales y Hilo Rojo"
      introduction="Destinos astrales presenta perfiles que coinciden con tus preferencias para que explores sus afinidades. La astrología puede abrir una conversación; el interés y el trato respetuoso se construyen entre las personas."
    >
      <section>
        <h2>1. Completa tu perfil y preferencias</h2>
        <p>
          Inicia sesión, completa tu perfil y añade los datos necesarios para
          calcular tu carta natal. Después abre{" "}
          <Link href="/destinos">Destinos astrales</Link>. La herramienta
          muestra perfiles que cumplen tus preferencias y tienen una carta
          natal completa; si todavía no aparecen perfiles, puedes volver a
          consultar más adelante.
        </p>
      </section>
      <section>
        <h2>2. Revisa cada perfil con calma</h2>
        <p>
          En cada ficha puedes ver la información de perfil disponible, algunas
          posiciones natales y un porcentaje de afinidad calculado mediante la
          comparación astrológica. Usa las flechas para recorrer perfiles y
          abre “Ver compatibilidad detallada” si quieres revisar los aspectos
          entre las cartas.
        </p>
        <p>
          Si falta una hora natal, la afinidad puede ser aproximada y se omiten
          los contactos que dependen de la Luna y el Ascendente. Un porcentaje
          no es una probabilidad de éxito ni describe por sí solo a una persona.
        </p>
      </section>
      <section>
        <h2>3. Pasar, expresar interés o conversar</h2>
        <p>
          Puedes pasar un perfil o indicar que te gusta. Si el interés es
          mutuo, AstraRed abre la conversación; si todavía no lo es, la
          herramienta te indica que te avisará cuando exista una conexión
          mutua. Un “me gusta” individual no significa que la otra persona haya
          respondido.
        </p>
      </section>
      <section>
        <h2>Qué significa Hilo Rojo</h2>
        <p>
          Hilo Rojo es un nombre simbólico para una señal de afinidad dentro de
          la experiencia de AstraRed. No demuestra que dos personas estén
          destinadas a estar juntas, que compartan una relación ni que exista
          interés mutuo. La conversación y los límites dependen siempre de las
          personas.
        </p>
      </section>
      <section>
        <h2>Cuida tu privacidad y seguridad</h2>
        <p>
          Los perfiles que exploras son visibles para personas con cuenta según
          la información que cada quien elige compartir. Evita publicar datos
          de nacimiento, ubicación precisa u otra información que no quieras
          mostrar. Para recomendaciones de convivencia, consulta la{" "}
          <Link href="/seguridad">guía de comunidad segura</Link> y la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </section>
      <p>
        Para entender cómo se calcula una comparación manual entre dos cartas,
        consulta la guía de{" "}
        <Link href="/guias/sinastria">sinastría</Link>.
      </p>
    </PublicDocument>
  );
}
