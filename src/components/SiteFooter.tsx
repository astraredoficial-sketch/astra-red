import Link from "next/link";
import { cacheLife } from "next/cache";
import { BrandMark } from "@/components/BrandMark";

async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const footerGroups = [
  {
    title: "Explora",
    links: [
      { label: "Carta natal", href: "/guias/carta-natal" },
      { label: "Afinidades", href: "/guias/sinastria" },
      { label: "Destinos astrales", href: "/destinos" },
      { label: "Calendario astral", href: "/calendario" },
    ],
  },
  {
    title: "Guías",
    links: [
      { label: "Todas las guías", href: "/guias" },
      { label: "Fases de la Luna", href: "/guias/calendario-lunar" },
      { label: "Entender la sinastría", href: "/guias/sinastria" },
    ],
  },
  {
    title: "Ayuda y legal",
    links: [
      { label: "Comunidad segura", href: "/seguridad" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Términos de uso", href: "/terminos" },
      {
        label: "Contacto",
        href: "mailto:astrared.oficial@gmail.com",
      },
    ],
  },
];

export async function SiteFooter() {
  const currentYear = await getCurrentYear();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#080711]/95">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-12">
          <div className="space-y-4">
            <Link href="/" aria-label="AstraRed, inicio">
              <BrandMark size="sm" />
            </Link>
            <p className="max-w-sm text-sm leading-6 text-muted">
              Carta natal, conexiones y ciclos astrales para conocerte y
              conectar con intención.
            </p>
            <p className="max-w-sm text-xs leading-5 text-muted">
              La astrología es una herramienta simbólica de reflexión; no es
              una predicción científica ni asesoría profesional.
            </p>
          </div>
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold text-white">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-6 pt-6">
          <p className="max-w-4xl text-xs leading-5 text-muted">
            Promoción de inauguración: un mes sin costo desde la apertura
            pública. Después, el Calendario astral y Hilo Rojo requerirán VIP.
            Planes: USD 4.99/mes o USD 34.99/año. La fecha de inauguración y las
            condiciones de compra se informarán antes de activar cualquier
            cobro. Cada plan será un pago único por su periodo, sin renovación
            automática.
          </p>
          <div className="flex flex-col gap-4 text-xs text-muted sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p>
                © {currentYear} AstraRed · Servicio para personas mayores de 18
                años · Barinas, Venezuela
              </p>
              <p>
                Las aportaciones son voluntarias y no habilitan funciones VIP.
              </p>
            </div>
            <a
              href="https://ko-fi.com/astrared"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center self-start rounded-full border border-thread/40 px-4 py-2 font-medium text-[#f0d9e2] transition-colors hover:border-thread hover:bg-thread/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:self-auto"
            >
              Apoyar AstraRed
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
