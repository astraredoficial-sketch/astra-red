import Link from "next/link";
import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Términos de uso",
  description:
    "Condiciones de acceso, membresía, contenido y seguridad para usar AstraRed.",
  path: "/terminos",
});

export default function TermsPage() {
  return (
    <PublicDocument
      eyebrow="Legal · Condiciones"
      title="Términos de uso"
      introduction="Estas condiciones explican cómo usar AstraRed de forma segura, cómo funcionan las cuentas y qué reglas aplican a las funciones gratuitas y de membresía."
    >
      <p className="text-sm text-muted">
        Vigentes desde el 16 de octubre de 2026 · Última actualización: 16 de
        octubre de 2026
      </p>

      <section>
        <h2>1. Servicio y aceptación</h2>
        <p>
          AstraRed es un servicio en línea operado desde Barinas, Venezuela,
          para explorar cartas natales, afinidades, conexiones y calendarios
          astrales. Al crear una cuenta o utilizar el servicio, aceptas estos
          términos y la{" "}
          <Link href="/privacidad">Política de privacidad</Link>. Si no estás de
          acuerdo, no crees una cuenta ni continúes usando las funciones
          autenticadas.
        </p>
      </section>

      <section>
        <h2>2. Edad, cuenta y seguridad</h2>
        <p>
          Solo pueden crear una cuenta personas de 18 años o más. Al registrarte
          declaras que cumples ese requisito y que los datos que proporcionas
          son correctos. Debes mantener tus credenciales seguras, notificarnos
          si sospechas de un acceso no autorizado y no compartir ni transferir
          tu cuenta.
        </p>
      </section>

      <section>
        <h2>3. Promoción y funciones de pago</h2>
        <p>
          La promoción de inauguración ofrece un mes sin costo desde la fecha de
          apertura pública, que se anunciará en AstraRed. Finalizada la
          promoción, el Calendario astral y Hilo Rojo requerirán una membresía
          VIP; el resto de las funciones seguirá sujeto a lo que se indique en
          el servicio.
        </p>
        <p>
          Los planes VIP aprobados son USD 4.99 por mes o USD 34.99 por año.
          A la fecha de vigencia de estos términos, AstraRed no procesa pagos
          de membresía ni tiene membresías VIP activas. La promoción inaugural
          no tiene costo. Antes de habilitar una compra, mostraremos
          el precio total, duración, proveedor de pago, reembolsos, impuestos
          aplicables y cualquier limitación, y solicitaremos tu aceptación
          expresa.
        </p>
        <p>
          Los planes indicados no constituyen autorización para cobrarte ni
          crean una suscripción. La membresía se contratará únicamente cuando
          exista una pantalla de compra habilitada y completes su aceptación.
          Cada plan será un pago único por el periodo elegido y no se renovará
          automáticamente; un nuevo periodo requerirá una nueva compra. Las
          aportaciones efectuadas mediante Ko-fi son voluntarias, se procesan
          fuera de AstraRed y no compran una membresía.
        </p>
      </section>

      <section>
        <h2>4. Astrología y decisiones personales</h2>
        <p>
          Las cartas, compatibilidades, fases y recomendaciones son contenido
          simbólico para reflexión y entretenimiento. No son predicciones
          científicas, garantías sobre una relación ni consejos médicos,
          psicológicos, financieros o legales. Una puntuación de afinidad no
          determina la calidad ni el futuro de una relación. Usa tu criterio y
          toma tus propias decisiones.
        </p>
      </section>

      <section>
        <h2>5. Reglas de comunidad</h2>
        <p>No puedes utilizar AstraRed para:</p>
        <ul>
          <li>
            Crear una cuenta falsa, suplantar a alguien o mentir de forma
            material sobre tu edad o identidad.
          </li>
          <li>
            Amenazar, acosar, intimidar, discriminar, perseguir o contactar
            repetidamente a alguien que no desea continuar la conversación.
          </li>
          <li>
            Compartir información privada, imágenes íntimas o conversaciones
            ajenas sin permiso, ni presionar a otras personas para que envíen
            contenido íntimo.
          </li>
          <li>
            Publicar contenido sexual explícito, explotar o poner en riesgo a
            menores, o promover violencia, trata, autolesión o actividades
            ilegales.
          </li>
          <li>
            Estafar, pedir dinero con engaños, enviar spam, promocionar
            servicios sin autorización, vulnerar sistemas o intentar acceder a
            datos ajenos.
          </li>
        </ul>
        <p>
          Puedes reportar o bloquear una cuenta desde la conversación cuando
          esas opciones estén disponibles. También puedes escribir a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          . Revisaremos los reportes y podremos retirar contenido, restringir
          funciones o suspender cuentas según la gravedad, la seguridad de la
          comunidad y la información disponible.
        </p>
      </section>

      <section>
        <h2>6. Tu contenido y derechos</h2>
        <p>
          Conservas los derechos sobre el contenido que aportas. Nos autorizas a
          alojarlo, procesarlo y mostrarlo de forma limitada mientras sea
          necesario para prestarte las funciones que eliges, mostrar tu perfil
          a otras personas usuarias y atender solicitudes de seguridad. Esta
          autorización termina cuando eliminas el contenido o tu cuenta, salvo
          copias residuales o conservación permitida por la ley.
        </p>
        <p>
          Solo publica contenido que tengas derecho a utilizar y evita exponer
          datos personales tuyos o de otras personas que no quieras compartir.
        </p>
      </section>

      <section>
        <h2>7. Disponibilidad y cambios del servicio</h2>
        <p>
          Procuramos mantener AstraRed disponible y seguro, pero pueden
          presentarse interrupciones por mantenimiento, incidentes técnicos o
          causas fuera de nuestro control. Podemos actualizar o retirar
          funciones; informaremos los cambios relevantes y no reduciremos
          derechos ya adquiridos por una membresía sin respetar las condiciones
          aplicables y la normativa correspondiente.
        </p>
      </section>

      <section>
        <h2>8. Suspensión y eliminación de cuenta</h2>
        <p>
          Puedes eliminar tu cuenta desde los ajustes disponibles. La
          desinstalación o el cierre de sesión no la eliminan. Podemos limitar
          o suspender el acceso cuando exista una infracción de estos términos,
          riesgo para una persona, fraude, obligación legal o un riesgo
          significativo para el servicio. Cuando sea razonable, comunicaremos
          el motivo y el canal para pedir una revisión.
        </p>
      </section>

      <section>
        <h2>9. Responsabilidad y contacto</h2>
        <p>
          AstraRed se ofrece para fines personales y de reflexión. En la medida
          permitida por la ley, no garantizamos resultados de compatibilidad ni
          encuentros, y no somos responsables de las decisiones o conductas de
          las personas usuarias fuera del servicio. Nada en estos términos
          limita derechos que no puedan excluirse legalmente.
        </p>
        <p>
          Para soporte, consultas sobre estas condiciones o solicitudes de
          revisión, escríbenos a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2>10. Actualizaciones</h2>
        <p>
          Publicaremos cualquier actualización de estos términos en esta
          página con su nueva fecha de vigencia. Si el cambio requiere tu
          aceptación expresa, la solicitaremos antes de que uses la función
          correspondiente.
        </p>
      </section>
    </PublicDocument>
  );
}
