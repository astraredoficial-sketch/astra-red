import type { Metadata } from "next";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Consulta las condiciones de acceso y uso de AstraRed durante su beta gratuita.",
  alternates: { canonical: "/terminos" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <PublicDocument
      eyebrow="Legal · Condiciones"
      title="Términos de uso"
      introduction="Al crear una cuenta o usar AstraRed, aceptas estas condiciones. El servicio está en beta y puede cambiar mientras aprendemos de su uso."
    >
      <section>
        <h2>1. Quién puede usar AstraRed</h2>
        <p>
          Debes tener al menos 18 años y proporcionar información de cuenta
          veraz. Eres responsable de proteger tus credenciales y de la actividad
          realizada desde tu cuenta.
        </p>
      </section>
      <section>
        <h2>2. Beta gratuita</h2>
        <p>
          Durante la beta, las funciones disponibles se ofrecen sin cobro y no
          se activa una suscripción de pago. Los precios que puedan evaluarse
          para el futuro no constituyen una oferta ni generan un cargo. Cualquier
          servicio pagado requerirá información y aceptación antes de estar
          disponible.
        </p>
      </section>
      <section>
        <h2>3. Astrología y límites del servicio</h2>
        <p>
          Las cartas, afinidades y recomendaciones de AstraRed presentan la
          astrología como una práctica simbólica y de reflexión personal. No son
          resultados científicos, garantías de compatibilidad ni consejos
          médicos, psicológicos, financieros o legales. Las decisiones siguen
          siendo tuyas.
        </p>
      </section>
      <section>
        <h2>4. Conducta y seguridad</h2>
        <p>
          No puedes acosar, amenazar, suplantar, estafar, publicar datos
          privados de otras personas ni usar el servicio para actividades
          ilegales. Podemos limitar o cerrar cuentas que vulneren estas reglas o
          pongan en riesgo a la comunidad.
        </p>
      </section>
      <section>
        <h2>5. Disponibilidad y contenido</h2>
        <p>
          La beta se ofrece tal como está: algunas funciones pueden cambiar,
          interrumpirse o presentar errores. Mantienes los derechos sobre el
          contenido que aportas y autorizas a AstraRed a tratarlo únicamente en
          la medida necesaria para operar y mostrar las funciones que solicitas.
        </p>
      </section>
      <section>
        <h2>6. Cuenta y contacto</h2>
        <p>
          Puedes solicitar la eliminación de tu cuenta desde las opciones
          disponibles o contactar a{" "}
          <a href="mailto:astraared.oficial@gmail.com">
            astraared.oficial@gmail.com
          </a>
          . Podemos actualizar estos términos; la versión vigente se publicará
          en esta página.
        </p>
      </section>
      <p className="text-xs text-muted">
        Los términos son un borrador operativo para la beta y deben revisarse
        con asesoría legal antes de considerarse asesoría jurídica definitiva.
      </p>
    </PublicDocument>
  );
}
