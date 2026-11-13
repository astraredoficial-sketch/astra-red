import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Cómo se crea el horóscopo diario",
  description:
    "Conoce cómo AstraRed calcula el horóscopo diario por signo y fecha local, por qué cambia la prosa y cuáles son los límites de esta lectura simbólica.",
  path: "/guias/horoscopo-diario",
  type: "article",
});

export default function DailyHoroscopeGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Horóscopo diario"
      title="Cómo se crea el horóscopo diario de AstraRed"
      introduction="Una explicación de qué cielo se calcula, cómo cambia la prosa por signo y fecha, y qué puedes esperar —y no esperar— de una lectura astrológica diaria."
    >
      <section>
        <h2>Una lectura general por signo solar</h2>
        <p>
          El horóscopo diario ofrece una lectura general para el signo solar
          que eliges. No es una interpretación de tu carta natal ni una
          predicción personalizada. Para calcularlo, AstraRed no necesita tu
          fecha, hora ni lugar de nacimiento: usa la fecha y la zona horaria
          local del dispositivo.
        </p>
      </section>

      <section>
        <h2>Cómo se calcula el cielo del día</h2>
        <p>
          El motor astronómico calcula las posiciones planetarias para las
          12:00 de la fecha local. La página muestra el signo del Sol, el signo
          de la Luna y la fase lunar. Las posiciones de varios astros se usan
          después para relacionar temas simbólicos con el signo seleccionado.
          El mediodía local es una referencia común para el día; por eso una
          fecha puede corresponder a instantes distintos según la zona horaria.
        </p>
      </section>

      <section>
        <h2>Por qué cambia la prosa cada día</h2>
        <p>
          La lectura se calcula en tu navegador al consultar la página; no
          depende de una tarea diaria en un servidor ni de generar un texto
          nuevo con inteligencia artificial. La prosa principal combina frases
          editoriales seleccionadas según la fecha local y el signo. Así, la
          misma fecha local, zona horaria y signo producen un resultado
          estable, y la prosa principal cambia al avanzar el día.
        </p>
        <p>
          Las pruebas del proyecto verifican que la prosa principal no se
          repita durante 365 fechas consecutivas para cada signo. Esto no
          significa que cada apartado se escriba desde cero ni que la prosa sea
          única para siempre.
        </p>
      </section>

      <section>
        <h2>Cómo interpretar sus apartados</h2>
        <p>
          Las secciones de vínculos, trabajo, bienestar y acción son temas de
          reflexión, no hechos sobre tu vida. El número y el color se presentan
          como elementos simbólicos y lúdicos; no predicen suerte ni resultados.
        </p>
      </section>

      <section>
        <h2>Una invitación, no una instrucción</h2>
        <p>
          La astrología se aborda en AstraRed como una tradición simbólica para
          la reflexión, no como una disciplina científica. Usa la lectura como
          una pregunta o punto de partida, contrástala con tu situación real y
          decide con tu propio criterio. No sustituye información práctica,
          asesoría profesional ni atención de salud.
        </p>
      </section>

      <p>
        <Link href="/horoscopo">Consulta el horóscopo diario</Link>. Se requiere
        iniciar sesión; la herramienta es gratuita. Para conocer las demás
        herramientas, explora las{" "}
        <Link href="/guias">guías de AstraRed</Link> o revisa la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
