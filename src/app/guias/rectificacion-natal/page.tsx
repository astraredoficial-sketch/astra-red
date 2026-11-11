import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Guía de rectificación de hora natal",
  description:
    "Aprende a comparar horas natales candidatas con acontecimientos importantes de tu vida usando la herramienta de rectificación de AstraRed.",
  path: "/guias/rectificacion-natal",
  type: "article",
});

export default function NatalTimeRectificationGuide() {
  return (
    <PublicDocument
      eyebrow="Guía · Carta natal"
      title="Cómo usar la rectificación de hora natal"
      introduction="La herramienta de rectificación de AstraRed calcula cartas para distintas horas posibles de nacimiento y las compara con acontecimientos importantes de tu vida. Así puedes explorar qué candidatas muestran mayor correspondencia con las fechas que registraste."
    >
      <section>
        <h2>Antes de empezar</h2>
        <p>
          Reúne tu fecha y lugar de nacimiento y define el intervalo horario más
          razonable según los datos que tengas. Cuanto más acotado y fiable sea
          el intervalo, más útil será la comparación. Necesitarás la zona
          horaria histórica del lugar de nacimiento y las coordenadas de la
          ciudad; la herramienta permite un máximo de 300 horas candidatas por
          expediente.
        </p>
      </section>
      <section>
        <h2>1. Crea un expediente</h2>
        <p>
          Entra en tu cuenta, abre Carta natal y selecciona la herramienta de
          rectificación. Indica fecha, ciudad y país de nacimiento, latitud y
          longitud, además de la zona horaria IANA correspondiente (por
          ejemplo, <code>America/Caracas</code>). Después, define el inicio y
          el final del intervalo con la hora local y el paso en minutos entre
          candidatas. Un paso menor genera más cartas y no necesariamente un
          resultado más fiable.
        </p>
        <p>
          Guarda el expediente para comenzar. Cada expediente conserva el
          intervalo que quieres comparar y sus acontecimientos asociados.
        </p>
      </section>
      <section>
        <h2>2. Registra acontecimientos importantes</h2>
        <p>
          Añade acontecimientos de los que recuerdes la fecha con la mayor
          precisión posible, como una mudanza, un cambio profesional, un
          matrimonio, una separación, el nacimiento de un hijo o una operación
          importante. Puedes registrar hasta 50 por expediente.
        </p>
        <p>
          Elige una categoría, la precisión de la fecha y el intervalo de fechas
          que corresponda. Si solo conoces el mes o el año, usa ese período en
          lugar de inventar un día exacto. La zona horaria del acontecimiento es
          opcional; si no la indicas, se usará la zona natal. Asigna una
          relevancia de 1 a 5 y, si te ayuda, añade una nota privada breve.
          Registra hechos concretos y evita incluir detalles personales que no
          sean necesarios.
        </p>
      </section>
      <section>
        <h2>3. Ejecuta y revisa la comparación</h2>
        <p>
          Con al menos un acontecimiento guardado, ejecuta la evaluación. La
          herramienta compara las candidatas mediante tránsitos, progresiones
          secundarias y arco solar. Puedes ajustar el peso de cada técnica; un
          peso de cero la excluye de la comparación.
        </p>
        <p>
          Revisa el orden de las horas candidatas y la evidencia asociada a los
          acontecimientos. La pantalla muestra hasta cinco candidatas y
          detalles de los contactos astrológicos considerados. Si la fecha de
          un evento es aproximada, la hora local cae en un cambio de horario o
          hay pocos datos, interpreta el resultado con especial cautela.
        </p>
      </section>
      <section>
        <h2>Cómo se calculan y cómo leer los resultados</h2>
        <p>
          Para cada candidata, AstraRed calcula las posiciones astronómicas de
          la carta natal y las compara con las fechas registradas mediante
          tránsitos, progresiones secundarias y arco solar. El motor usa
          posiciones geocéntricas del zodiaco tropical y casas Placidus, con
          casas iguales cuando Placidus no está disponible. Los resultados se
          ordenan por la correspondencia calculada con los acontecimientos y
          las ponderaciones elegidas.
        </p>
        <p>
          El formulario registra fechas, no horas de los acontecimientos: para
          cada fecha la herramienta compara varios momentos del día, y para un
          intervalo usa fechas representativas. Por eso, la precisión del
          orden depende de la calidad del intervalo natal, la zona horaria, las
          fechas y las ponderaciones. Revisa el detalle de contactos y compara
          los resultados con tus registros.
        </p>
      </section>
      <p>
        Tus expedientes y acontecimientos se presentan como privados dentro de
        la herramienta. Consulta también la{" "}
        <Link href="/privacidad">política de privacidad</Link> y la guía para{" "}
        <Link href="/guias/carta-natal">empezar a leer tu carta natal</Link>.
      </p>
      <p>
        <Link href="/carta">Ir a Carta natal</Link> para abrir la herramienta
        desde tu cuenta.
      </p>
    </PublicDocument>
  );
}
