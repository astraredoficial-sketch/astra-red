import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Seguridad y comunidad",
  description:
    "Recomendaciones para cuidar tu privacidad y contribuir a una comunidad respetuosa en AstraRed.",
  path: "/seguridad",
});

export default function SafetyPage() {
  return (
    <PublicDocument
      eyebrow="Seguridad y ayuda"
      title="Conexiones con respeto"
      introduction="AstraRed está en beta. La astrología puede abrir una conversación, pero el respeto, el consentimiento y el criterio personal siempre van primero."
    >
      <section>
        <h2>Cuida tu información</h2>
        <ul>
          <li>No compartas contraseñas, códigos de acceso ni datos financieros.</li>
          <li>
            Tu hora y lugar exactos de nacimiento son datos privados; compártelos
            solo si comprendes por qué los necesita una función.
          </li>
          <li>
            Si decides conocer a alguien fuera de AstraRed, organiza el
            encuentro en un lugar público e informa a alguien de confianza.
          </li>
        </ul>
      </section>
      <section>
        <h2>Trata a las demás personas con respeto</h2>
        <p>
          No toleramos acoso, amenazas, suplantación, discriminación, presión
          para compartir imágenes ni la publicación de datos privados ajenos. Si
          una conversación te incomoda, deja de responder y usa las opciones de
          seguridad disponibles en la aplicación.
        </p>
      </section>
      <section>
        <h2>Reporta un problema</h2>
        <p>
          Para reportar una cuenta, contenido o incidente de seguridad, escribe
          a{" "}
          <a href="mailto:astraared.oficial@gmail.com">
            astraared.oficial@gmail.com
          </a>{" "}
          e incluye la información necesaria para investigar, sin reenviar datos
          sensibles de otras personas que no sean pertinentes.
        </p>
      </section>
      <p>
        Consulta también los{" "}
        <Link href="/terminos">términos de uso</Link> y la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
