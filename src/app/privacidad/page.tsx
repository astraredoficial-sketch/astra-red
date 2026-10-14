import { PublicDocument } from "@/components/PublicDocument";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Política de privacidad",
  description:
    "Conoce cómo AstraRed trata y protege los datos de cuenta, nacimiento, perfil y conversación durante la beta.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return (
    <PublicDocument
      eyebrow="Legal · Privacidad"
      title="Política de privacidad"
      introduction="Esta política explica qué información utiliza AstraRed, para qué la necesita y cómo puedes ejercer control sobre tus datos. AstraRed es un producto en beta operado desde Venezuela."
    >
      <section>
        <h2>1. Quién es responsable</h2>
        <p>
          El responsable del servicio es AstraRed. Para consultas sobre
          privacidad puedes escribir a{" "}
          <a href="mailto:astrared.oficial@gmail.com">
            astrared.oficial@gmail.com
          </a>
          .
        </p>
      </section>
      <section>
        <h2>2. Datos que tratamos</h2>
        <ul>
          <li>
            Datos de cuenta, como correo electrónico y credenciales gestionadas
            por el proveedor de autenticación.
          </li>
          <li>
            Datos de nacimiento y ubicación de nacimiento, usados para calcular
            la carta natal y las afinidades.
          </li>
          <li>
            Información de perfil que aportas, preferencias de conexión,
            interacciones y mensajes.
          </li>
          <li>
            Datos técnicos mínimos necesarios para operar, proteger y
            diagnosticar el servicio.
          </li>
        </ul>
        <p>
          Los datos de nacimiento precisos no se presentan como información
          pública del perfil. Las personas usuarias pueden ver la información
          que eliges mostrar en tu perfil y la que compartes en una conversación.
        </p>
      </section>
      <section>
        <h2>3. Finalidades</h2>
        <p>
          Usamos la información para crear tu cuenta, calcular funciones
          astrológicas, mostrar perfiles y afinidades, habilitar mensajes,
          administrar preferencias, mantener la seguridad y responder a
          solicitudes de soporte. No usamos datos sensibles para publicidad
          segmentada.
        </p>
      </section>
      <section>
        <h2>4. Proveedores y almacenamiento</h2>
        <p>
          AstraRed se aloja en Vercel y utiliza Supabase para autenticación,
          base de datos y almacenamiento de archivos. Estos proveedores pueden
          procesar información para prestar sus servicios; su tratamiento
          depende también de las políticas y configuraciones de cada proveedor.
          Si decides apoyar el proyecto desde Ko-fi, la plataforma y el
          proveedor de pago que elijas (incluido PayPal, si está disponible)
          procesan la aportación conforme a sus respectivas condiciones y
          políticas de privacidad.
        </p>
      </section>
      <section>
        <h2>5. Cookies y medición</h2>
        <p>
          En esta etapa no usamos cookies publicitarias ni herramientas de
          analítica de terceros. La sesión de acceso puede mantenerse en el
          almacenamiento local del navegador para que no tengas que iniciar
          sesión en cada visita.
        </p>
      </section>
      <section>
        <h2>6. Conservación y control</h2>
        <p>
          Conservamos los datos mientras sean necesarios para prestar el
          servicio y atender obligaciones aplicables. Puedes solicitar acceso,
          corrección o eliminación de tu cuenta y datos escribiendo al correo de
          contacto. La eliminación puede requerir conservar temporalmente
          información mínima cuando sea necesario para seguridad o cumplimiento
          legal.
        </p>
      </section>
      <section>
        <h2>7. Edad y cambios</h2>
        <p>
          AstraRed está dirigido exclusivamente a personas de 18 años o más.
          No solicitamos documentos de identidad para verificar la edad. Si
          detectamos una cuenta de una persona menor de edad, podremos
          suspenderla y eliminar sus datos. Esta política puede actualizarse
          cuando cambien el producto o sus prácticas; publicaremos aquí la
          versión vigente.
        </p>
      </section>
      <section>
        <h2>8. Búsqueda ampliada de localidades</h2>
        <p>
          Si eliges buscar una localidad en OpenStreetMap durante el registro,
          enviamos el nombre que escribiste y el país seleccionado a Nominatim,
          su servicio de búsqueda geográfica, para encontrar coincidencias. La
          consulta no incluye tu fecha ni hora de nacimiento. El servicio está
          sujeto a la{" "}
          <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy">
            política de privacidad de OpenStreetMap Foundation
          </a>{" "}
          y sus datos a la{" "}
          <a href="https://www.openstreetmap.org/copyright">
            licencia y atribución de OpenStreetMap
          </a>
          .
        </p>
      </section>
      <p className="text-xs text-muted">
        Este texto describe las prácticas actuales de la beta y no sustituye la
        revisión de un profesional legal en Venezuela.
      </p>
    </PublicDocument>
  );
}
