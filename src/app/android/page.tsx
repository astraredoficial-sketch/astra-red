import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import release from "@/lib/android-release.json";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "AstraRed para Android",
  description:
    "Información oficial para descargar AstraRed en Android, verificar su firma y consultar los permisos de la aplicación.",
  path: "/android",
});

const permissionDescriptions: Record<string, string> = {
  "android.permission.INTERNET":
    "Conecta la aplicación con AstraRed y sus servicios en línea.",
  "android.permission.POST_NOTIFICATIONS":
    "Permite recibir avisos si decides activarlos en Android.",
};

function formatFileSize(sizeBytes: number): string {
  return `${new Intl.NumberFormat("es", {
    maximumFractionDigits: 1,
  }).format(sizeBytes / 1024 / 1024)} MB`;
}

function formatReleaseDate(releasedAt: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${releasedAt}T12:00:00Z`));
}

export default function AndroidDownloadPage() {
  return (
    <main className="starfield min-h-screen bg-[#07060c] px-5 pb-14 pt-6 text-ink sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="AstraRed, inicio">
            <BrandMark size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Volver al inicio
          </Link>
        </header>

        <section
          aria-labelledby="android-title"
          className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0a11]/85 p-6 sm:mt-14 sm:p-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-thread">
            Aplicación oficial · Android
          </p>
          <h1
            id="android-title"
            className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl"
          >
            AstraRed para Android
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#d2c8dc]">
            Consulta AstraRed desde tu dispositivo Android. Descarga la
            aplicación únicamente desde esta página oficial y revisa su versión,
            firma y permisos antes de instalarla.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            {release.available && release.fileName ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-astral">
                      Descarga oficial
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-white">
                      Versión {release.versionName}
                    </h2>
                    {release.releasedAt && (
                      <p className="mt-1 text-sm text-muted">
                        Actualizada el {formatReleaseDate(release.releasedAt)}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/downloads/${release.fileName}`}
                    download
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-thread px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e61f53] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
                      <path d="M5 17v3h14v-3" />
                    </svg>
                    Descargar APK
                  </a>
                </div>

                <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Formato</dt>
                    <dd className="mt-1 font-medium text-white">APK</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tamaño</dt>
                    <dd className="mt-1 font-medium text-white">
                      {release.sizeBytes
                        ? formatFileSize(release.sizeBytes)
                        : "No disponible"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted">SHA-256 del archivo</dt>
                    <dd className="mt-1 break-all rounded-lg bg-black/30 p-3 font-mono text-xs leading-5 text-[#f0d9e2]">
                      {release.sha256 ?? "No disponible"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted">
                      SHA-256 del certificado de firma
                    </dt>
                    <dd className="mt-1 break-all rounded-lg bg-black/30 p-3 font-mono text-xs leading-5 text-[#f0d9e2]">
                      {release.certificateSha256 ?? "No disponible"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-astral">
                  Primera publicación
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                  La descarga firmada está en preparación
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d2c8dc]">
                  Publicaremos el APK cuando la compilación de release tenga una
                  firma válida y podamos mostrar su tamaño y huellas SHA-256.
                  No ofrecemos como descarga oficial una APK de depuración ni
                  una versión sin verificar.
                </p>
                <p className="mt-4 text-sm text-muted">
                  Versión prevista: {release.versionName} · Identificador:{" "}
                  <code className="text-[#f0d9e2]">{release.packageName}</code>
                </p>
              </>
            )}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="permissions-title">
              <h2
                id="permissions-title"
                className="font-serif text-xl text-white"
              >
                Permisos de Android
              </h2>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-[#d2c8dc]">
                {release.permissions.map((permission) => (
                  <li
                    key={permission}
                    className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                  >
                    <span className="font-medium text-white">
                      {permissionDescriptions[permission] ?? permission}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="install-title">
              <h2 id="install-title" className="font-serif text-xl text-white">
                Instalación y confianza
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#d2c8dc]">
                Android puede solicitar permiso para instalar una aplicación
                descargada desde el navegador. La firma permite comprobar que
                el APK se firmó con la llave de AstraRed y que las
                actualizaciones usan la misma llave; no equivale a una
                certificación de Google ni garantiza que Play Protect nunca
                muestre una advertencia.
              </p>
              {release.available && release.fileName && release.sha256 && (
                <p className="mt-3 text-sm leading-6 text-[#d2c8dc]">
                  En Windows puedes verificar el archivo descargado con{" "}
                  <code className="break-all rounded bg-black/30 px-1.5 py-1 font-mono text-xs text-[#f0d9e2]">
                    certutil -hashfile {release.fileName} SHA256
                  </code>{" "}
                  y comparar el resultado con la huella publicada arriba.
                </p>
              )}
              <p className="mt-3 text-sm leading-6 text-[#d2c8dc]">
                Si ya tienes una compilación de prueba instalada con otra firma,
                Android podría pedir desinstalarla antes de instalar esta
                primera versión oficial.
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-muted">
            <p>
              Operador: AstraRed · Soporte:{" "}
              <a
                className="text-[#f0d9e2] underline underline-offset-4 hover:text-white"
                href="mailto:astrared.oficial@gmail.com"
              >
                astrared.oficial@gmail.com
              </a>
            </p>
            <p className="mt-2">
              Consulta la{" "}
              <Link
                className="text-[#f0d9e2] underline underline-offset-4 hover:text-white"
                href="/privacidad"
              >
                Política de privacidad
              </Link>{" "}
              y los{" "}
              <Link
                className="text-[#f0d9e2] underline underline-offset-4 hover:text-white"
                href="/terminos"
              >
                Términos de uso
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
