import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Seguridad y comunidad",
  description:
    "Reglas de convivencia, consejos de seguridad y formas de reportar o bloquear en AstraRed.",
  path: "/seguridad",
});

export default function SafetyPage() {
  return (
    <PublicDocument
      eyebrow="Seguridad y ayuda"
      title="Una comunidad con respeto"
      introduction="AstraRed es para personas adultas que buscan conocerse y conectar. El respeto, el consentimiento y la seguridad van antes que cualquier afinidad."
    >
      <section>
        <h2>Conductas que no permitimos</h2>
        <ul>
          <li>
            Acoso, amenazas, intimidación, discriminación, persecución o
            contacto insistente después de que alguien haya expresado que no
            quiere continuar.
          </li>
          <li>
            Suplantación, perfiles engañosos, fraude, estafas, spam o uso de la
            aplicación para vender o promocionar servicios sin autorización.
          </li>
          <li>
            Compartir datos privados o contenido íntimo de otras personas sin
            su consentimiento, así como presionar para obtener imágenes o
            información privada.
          </li>
          <li>
            Cualquier intento de explotar, sexualizar o poner en riesgo a una
            persona menor de 18 años. AstraRed no permite cuentas de menores.
          </li>
          <li>
            Amenazas o promoción de violencia, trata de personas, actividades
            ilegales, autolesión o daño a otras personas.
          </li>
        </ul>
      </section>

      <section>
        <h2>Protege tus datos y encuentros</h2>
        <ul>
          <li>
            No compartas contraseñas, códigos de acceso, información financiera
            ni documentos de identidad por chat.
          </li>
          <li>
            Tu fecha, hora y lugar precisos de nacimiento se usan para tu carta;
            no los incluyas en tu perfil o mensajes si no quieres compartirlos.
          </li>
          <li>
            Mantén las conversaciones en la plataforma hasta sentir confianza.
            Desconfía de solicitudes urgentes de dinero o enlaces inesperados.
          </li>
          <li>
            Si acuerdas conocer a alguien en persona, elige un lugar público,
            organiza tu propio transporte e informa a alguien de confianza.
          </li>
          <li>
            Puedes detener una conversación o conexión en cualquier momento.
            Una afinidad astrológica nunca reemplaza tu consentimiento ni tu
            criterio.
          </li>
        </ul>
      </section>

      <section>
        <h2>Reporta o bloquea</h2>
        <p>
          Desde una conversación puedes usar las opciones <strong>Reportar</strong>{" "}
          o <strong>Bloquear</strong>. Un reporte nos permite revisar la cuenta
          y el motivo que indiques; bloquear impide que esa persona te escriba.
          Para incidentes urgentes o problemas que no puedas reportar desde la
          app, escríbenos a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          . Si existe peligro inmediato, contacta también a los servicios de
          emergencia de tu localidad.
        </p>
        <p>
          Revisamos los reportes y podemos retirar contenido o restringir
          cuentas según la información disponible. No compartas información
          sensible de terceros que no sea necesaria para investigar.
        </p>
      </section>

      <p>
        Lee también los <Link href="/terminos">Términos de uso</Link> y la{" "}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>
    </PublicDocument>
  );
}
