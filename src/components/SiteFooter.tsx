import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const footerGroups = [
  {
    title: "Producto",
    links: [
      { label: "Carta natal", href: "/guias/carta-natal" },
      { label: "Afinidades y Hilo Rojo", href: "/guias/sinastria" },
      { label: "Calendario astral", href: "/calendario" },
    ],
  },
  {
    title: "Explorar",
    links: [
      { label: "Todas las guías", href: "/guias" },
      { label: "Entender tu carta natal", href: "/guias/carta-natal" },
      { label: "Fases de la Luna", href: "/guias/calendario-lunar" },
    ],
  },
  {
    title: "Seguridad y ayuda",
    links: [
      { label: "Comunidad segura", href: "/seguridad" },
      {
        label: "Escríbenos",
        href: "mailto:astraared.oficial@gmail.com",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacidad" },
      { label: "Términos de uso", href: "/terminos" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#080711]/95">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {footerGroups.map((group, index) => (
            <nav key={group.title} aria-label={group.title}>
              {index === 0 && (
                <div className="mb-5 space-y-3">
                  <Link href="/" aria-label="AstraRed, inicio">
                    <BrandMark size="sm" />
                  </Link>
                  <p className="max-w-xs text-sm leading-6 text-muted">
                    Carta natal, afinidades y calendario astral para explorar
                    tus ciclos con curiosidad.
                  </p>
                </div>
              )}
              <h2 className="text-sm font-semibold text-white">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© AstraRed. Beta gratuita para mayores de 18 años.</p>
          <a
            href="https://paypal.me/aronstereo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center self-start rounded-full border border-thread/40 px-4 py-2 font-medium text-[#f0d9e2] transition-colors hover:border-thread hover:bg-thread/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:self-auto"
          >
            Apoyar AstraRed
          </a>
        </div>
      </div>
    </footer>
  );
}
