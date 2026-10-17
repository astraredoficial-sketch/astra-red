import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Política de privacidad",
  description:
    "Cómo AstraRed usa, protege y conserva los datos de cuenta, nacimiento, perfil y conversación.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return (
    <PublicDocument
      eyebrow="Legal · Privacidad"
      title="Política de privacidad"
      introduction="En AstraRed cuidamos la información que nos confías. Aquí explicamos qué datos usamos, para qué, con quién se comparten y cómo puedes ejercer control sobre ellos."
    >
      <p className="text-sm text-muted">
        Vigente desde el 16 de octubre de 2026 · Última actualización: 16 de
        octubre de 2026
      </p>

      <section>
        <h2>1. Responsable y contacto</h2>
        <p>
          AstraRed, operado desde Barinas, Venezuela, es responsable del
          tratamiento de los datos descritos en esta política. Para consultas,
          solicitudes de privacidad o reportes relacionados con tus datos,
          escríbenos a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          . Incluye el correo de tu cuenta y explica tu solicitud; podríamos
          pedir información razonable para confirmar que eres titular de ella.
        </p>
      </section>

      <section>
        <h2>2. Información que utilizamos</h2>
        <ul>
          <li>
            <strong>Cuenta y edad:</strong> correo electrónico, credenciales
            gestionadas por Supabase y fecha de nacimiento declarada al crear la
            cuenta para confirmar que tienes 18 años o más. Esa fecha también
            se utiliza para calcular tu carta.
          </li>
          <li>
            <strong>Datos de nacimiento:</strong> fecha, hora (si la conoces),
            ciudad, país, coordenadas y zona horaria. Se usan para calcular tu
            carta y se guardan por separado de la información visible de tu
            perfil. No mostramos estos datos de entrada en tu perfil.
          </li>
          <li>
            <strong>Perfil:</strong> nombre que eliges mostrar, identidad,
            preferencias de conexión, búsqueda, foto y posiciones astrológicas
            calculadas a partir de tus datos de nacimiento. El perfil y la
            información que incluyes en él son visibles para personas
            autenticadas que exploran AstraRed.
          </li>
          <li>
            <strong>Actividad y comunicaciones:</strong> gustos, conexiones,
            mensajes entre personas conectadas, fechas que guardas en el
            calendario astral junto con la zona horaria del dispositivo usada
            para calcularlas, avisos, preferencias y reportes de seguridad. La
            lectura “Tu cielo de hoy” calcula tránsitos en el instante de
            consulta según esa zona horaria y no se guarda como historial.
          </li>
          <li>
            <strong>Datos técnicos:</strong> información de sesión, navegador o
            dispositivo, dirección IP y registros técnicos que los proveedores
            de infraestructura generan para prestar, proteger y diagnosticar el
            servicio.
          </li>
          <li>
            <strong>Avisos en Android:</strong> si activas las notificaciones,
            se registra el token del dispositivo necesario para enviar esos
            avisos. Puedes desactivarlas desde los ajustes del dispositivo.
          </li>
        </ul>
        <p>
          La carta y las preferencias de conexión pueden revelar o permitir
          inferir aspectos personales. No compartas información en tu perfil o
          mensajes que no quieras comunicar a otras personas.
        </p>
        <p>
          La fecha, hora y ubicación de nacimiento no forman parte de tu perfil
          visible. El perfil puede mostrar las posiciones astrológicas
          calculadas, que sí pueden ser vistas por otras personas autenticadas.
          Puedes solicitar la eliminación de tu cuenta y de los datos asociados
          desde los ajustes de la cuenta o escribiéndonos; las copias de
          respaldo y ciertos registros técnicos pueden permanecer durante los
          periodos limitados descritos en esta política.
        </p>
      </section>

      <section>
        <h2>3. Para qué usamos la información</h2>
        <ul>
          <li>Crear y proteger tu cuenta, autenticarte y ofrecer soporte.</li>
          <li>
            Calcular cartas, afinidades y contenido astral que solicitas; mostrar
            perfiles de acuerdo con tus preferencias.
          </li>
          <li>
            Habilitar conexiones, mensajes y avisos; prevenir abuso, investigar
            reportes y aplicar las reglas de la comunidad.
          </li>
          <li>
            Mantener, depurar y proteger AstraRed, detectar errores y cumplir
            obligaciones legales válidas.
          </li>
        </ul>
        <p>
          No vendemos tus datos personales ni usamos analítica publicitaria de
          terceros. La astrología se presenta como una práctica simbólica de
          reflexión, no como una evaluación científica.
        </p>
      </section>

      <section>
        <h2>4. Fotos y contenido del perfil</h2>
        <p>
          Si subes una foto, el servidor la procesa para orientarla y optimizar
          su formato antes de guardarla en el almacenamiento privado de
          Supabase. AstraRed sirve las fotos a personas con sesión mediante
          enlaces temporales. Las imágenes que eliges mostrar pueden ser vistas
          por otras personas usuarias autenticadas; evita incluir datos
          identificativos que no quieras compartir.
        </p>
        <p>
          El contenido que publicas o envías se trata para prestar la función
          correspondiente, mantener la seguridad y atender reportes. Los
          mensajes se limitan a personas conectadas; los reportes pueden incluir
          datos de la conversación necesarios para revisar el caso.
        </p>
      </section>

      <section>
        <h2>5. Proveedores y destinatarios</h2>
        <p>
          Usamos Vercel para alojar la web y Supabase para autenticación, base
          de datos y almacenamiento. Estos proveedores procesan información por
          cuenta de AstraRed para prestar sus servicios y también generan sus
          propios registros técnicos. Solo compartimos con ellos lo necesario
          para esa operación.
        </p>
        <p>
          Si decides realizar una aportación voluntaria, Ko-fi y el proveedor de
          pago que elijas —por ejemplo, PayPal si está disponible— procesan la
          operación bajo sus propias condiciones y políticas. Esa aportación no
          es una compra de acceso ni activa una suscripción de AstraRed.
        </p>
        <p>
          A la fecha de esta política, AstraRed no procesa pagos de membresía.
          Antes de habilitar VIP informaremos qué proveedor procesa el pago y
          qué datos necesita para completar la compra; el proveedor tratará los
          datos de pago de acuerdo con su propia política.
        </p>
        <p>
          Podemos comunicar información cuando sea necesario para responder a
          una obligación legal válida, proteger a las personas, investigar
          fraude o hacer cumplir estas condiciones. No compartimos perfiles con
          anunciantes para publicidad dirigida.
        </p>
      </section>

      <section>
        <h2>6. Almacenamiento internacional y seguridad</h2>
        <p>
          AstraRed utiliza infraestructura en la nube. Según la región
          configurada por los proveedores y sus operaciones, los datos pueden
          procesarse o almacenarse fuera de Venezuela. Vercel y Supabase
          publican sus propias políticas y medidas de seguridad. Puedes
          escribirnos si necesitas más información sobre los proveedores
          utilizados.
        </p>
        <p>
          Aplicamos controles de acceso y medidas técnicas razonables para
          proteger cuentas, datos y archivos. Ningún servicio conectado a
          Internet puede garantizar seguridad absoluta. Si sospechas que tu
          cuenta o información está en riesgo, contáctanos de inmediato.
        </p>
      </section>

      <section>
        <h2>7. Cookies y almacenamiento local</h2>
        <p>
          AstraRed usa almacenamiento esencial del navegador para mantener tu
          sesión y las preferencias necesarias para que la aplicación funcione.
          No utilizamos cookies de publicidad ni analítica de terceros. Vercel,
          Supabase y otros proveedores pueden generar registros técnicos
          propios necesarios para operar sus servicios.
        </p>
      </section>

      <section>
        <h2>8. Conservación y eliminación</h2>
        <p>
          Conservamos los datos mientras tu cuenta esté activa y sean necesarios
          para prestar el servicio. Puedes iniciar la eliminación desde las
          opciones de tu cuenta; al completar el proceso, eliminamos la cuenta,
          los datos asociados y las fotos de perfil del almacenamiento activo.
          Las copias de respaldo y registros técnicos pueden conservarse por un
          periodo limitado conforme a los ciclos de los proveedores o cuando
          sean necesarios para seguridad y obligaciones legales.
        </p>
        <p>
          Desinstalar la aplicación o dejar de usarla no elimina tu cuenta.
          Solicita su eliminación desde tu cuenta o escribe a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2>9. Tus solicitudes</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos y
          plantear preguntas sobre su uso escribiéndonos al correo indicado.
          Atenderemos las solicitudes conforme a la normativa aplicable y
          podremos pedir verificación para proteger tu cuenta. Algunos datos
          pueden conservarse cuando exista una obligación legal o una razón
          válida de seguridad.
        </p>
      </section>

      <section>
        <h2>10. Personas menores de edad</h2>
        <p>
          AstraRed está dirigido exclusivamente a personas de 18 años o más.
          La edad se declara durante el registro; no solicitamos documentos de
          identidad como parte del registro normal. Si conoces una cuenta de
          una persona menor de edad, repórtala a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          . Si confirmamos que una persona es menor, suspenderemos la cuenta y
          eliminaremos sus datos según corresponda.
        </p>
      </section>

      <section>
        <h2>11. Cambios a esta política</h2>
        <p>
          Si cambian nuestras funciones o prácticas de datos, publicaremos la
          versión actualizada en esta página y cambiaremos la fecha de vigencia.
          Cuando un cambio requiera tu consentimiento, te lo solicitaremos antes
          de aplicarlo.
        </p>
      </section>
    </PublicDocument>
  );
}
