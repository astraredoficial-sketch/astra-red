import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo usar el calendario astral",
  description:
    "Aprende a consultar tu cielo de hoy, explorar fases lunares, planificar intenciones y guardar fechas en el calendario astral de AstraRed.",
  path: "/guias/calendario-lunar",
  type: "article",
});

export default function LunarCalendarGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Calendario astral"
      title="Cómo usar el calendario astral"
      introduction="El calendario astral reúne una lectura del cielo actual, un calendario lunar y sugerencias de fechas para distintas intenciones. Úsalo como referencia simbólica para reflexionar y organizarte, no como una instrucción sobre qué hacer."
    >
      <section>
        <h2>1. Consulta tu cielo de hoy</h2>
        <p>
          Inicia sesión y abre <Link href="/calendario">Calendario astral</Link>.
          En “Tu cielo de hoy” verás la fase y el signo lunar, el movimiento
          aparente de Mercurio y Venus, algunos contactos con tu carta natal y
          una pregunta para reflexionar. La lectura corresponde al momento de
          consulta y a la zona horaria local del dispositivo.
        </p>
        <p>
          Si desconoces tu hora de nacimiento, los contactos que dependen de la
          Luna natal y el Ascendente natal se excluyen. La ausencia de contactos
          destacados tampoco significa que el día carezca de importancia.
        </p>
      </section>
      <section>
        <h2>2. Explora las fases y elige una fecha</h2>
        <p>
          En el planificador lunar puedes cambiar de mes o seleccionar una
          fecha. El calendario muestra la fase lunar y su iluminación; al
          seleccionar un día, consulta su detalle antes de pasar al planificador
          de intenciones.
        </p>
        <p>
          Las ocho fases se suceden desde la Luna nueva y creciente hasta la
          Luna llena y menguante. La{" "}
          <a href="https://science.nasa.gov/moon/moon-phases/">
            guía de NASA sobre las fases lunares
          </a>{" "}
          (en inglés) explica el ciclo astronómico; sus asociaciones astrológicas
          son interpretaciones simbólicas distintas.
        </p>
      </section>
      <section>
        <h2>3. Revisa sugerencias y guarda fechas</h2>
        <p>
          En el planificador elige la intención que quieres explorar. Las
          sugerencias combinan la fase y el signo lunar con el movimiento de
          Mercurio o Venus cuando son relevantes para esa categoría. El índice
          mostrado es orientativo: no mide la probabilidad de éxito ni garantiza
          un resultado.
        </p>
        <p>
          Si una fecha te resulta útil, guárdala en tu agenda personal; puedes
          eliminarla después. Las fechas guardadas son privadas en tu cuenta.
          Por ahora, guardarlas no programa notificaciones automáticas.
        </p>
        <p>
          Los datos del calendario para cada fecha se calculan tomando como
          referencia las 12:00 de la zona horaria local que se muestra en la
          herramienta.
        </p>
      </section>
      <section>
        <h2>Úsalo como apoyo, no como una orden</h2>
        <p>
          Puedes anotar una intención, revisar cómo te sientes y decidir qué
          paso es realista. Una fecha astrológica no garantiza un resultado ni
          reemplaza información práctica, asesoría profesional o tu propio
          criterio. Las recomendaciones son interpretativas y pueden variar
          entre tradiciones.
        </p>
      </section>
      <p>
        Para otras referencias personales, consulta la guía de{" "}
        <Link href="/guias/ciclo-personal">ciclo personal</Link> o la de{" "}
        <Link href="/guias/revolucion-solar">revolución solar</Link>.
      </p>
      <p>
        <Link href="/acceso?mode=signup">Crea una cuenta</Link> para consultar
        tu calendario y revisa la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
