"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { AppNav } from "@/components/AppNav";
import { ChartWheel } from "@/components/ChartWheel";
import { Triad } from "@/components/Triad";
import { useSession } from "@/hooks/useSession";
import {
  describeAspect,
  formatArcMinutes,
  getNatalAspects,
} from "@/lib/astro/aspects";
import { generateLifeSummary, generatePlanetReadings } from "@/lib/astro/interpreter";
import { createNatalShareCard } from "@/lib/astro/share-card";
import {
  ASPECT_META,
  formatDegree,
  houseSystemLabel,
  PLANET_META,
  roundedPosition,
} from "@/lib/astro/constants";
import { supabase } from "@/lib/supabase/client";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo preparar la imagen para compartir."));
        return;
      }
      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error("El formato de la imagen generada no es válido."));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer la imagen generada."));
    reader.readAsDataURL(blob);
  });
}

async function createNatalPdf(image: Blob): Promise<Blob> {
  const [{ jsPDF }, imageBase64] = await Promise.all([
    import("jspdf"),
    blobToBase64(image),
  ]);
  const bitmap = await createImageBitmap(image);

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const imageHeight = (contentWidth * bitmap.height) / bitmap.width;
    const pageCount = Math.max(1, Math.ceil(imageHeight / contentHeight));
    const imageData = `data:image/png;base64,${imageBase64}`;

    pdf.setProperties({
      title: "Carta natal de AstraRed",
      author: "AstraRed",
      subject: "Carta natal para compartir",
    });

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage();
      pdf.addImage(
        imageData,
        "PNG",
        margin,
        margin - page * contentHeight,
        contentWidth,
        imageHeight,
        "natal-share-card",
        "FAST",
      );
    }

    return pdf.output("blob");
  } finally {
    bitmap.close();
  }
}

async function createProfileNatalPdf(
  chart: Parameters<typeof createNatalShareCard>[0],
  name: string,
): Promise<Blob> {
  const image = await createNatalShareCard(
    chart,
    name,
    generateLifeSummary(chart),
    generatePlanetReadings(chart),
  );
  return createNatalPdf(image);
}

function downloadPdf(pdf: Blob) {
  const pdfUrl = URL.createObjectURL(pdf);
  const download = document.createElement("a");
  download.href = pdfUrl;
  download.download = "carta-natal-astrared.pdf";
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
}

export default function CartaUi() {
  const router = useRouter();
  const { ready, store, me, error } = useSession();
  const [birthTimeResult, setBirthTimeResult] = useState<{
    userId: string;
    time: string | null;
    unknown: boolean;
    error: string;
  } | null>(null);
  const [preparingPdf, setPreparingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadNotice, setDownloadNotice] = useState("");
  const [shareError, setShareError] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [shareNotice, setShareNotice] = useState("");

  const userId = me?.id;
  useEffect(() => {
    if (typeof userId !== "string") return;
    const currentUserId = userId;

    let active = true;

    async function loadBirthTime() {
      const { data, error: detailsError } = await supabase
        .from("birth_details")
        .select("birth_time, birth_time_unknown")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!active) return;
      if (detailsError) {
        setBirthTimeResult({
          userId: currentUserId,
          time: null,
          unknown: false,
          error: `No se pudo cargar la hora de nacimiento: ${detailsError.message}`,
        });
        return;
      }
      setBirthTimeResult({
        userId: currentUserId,
        time: data?.birth_time ?? null,
        unknown: data?.birth_time_unknown ?? false,
        error: "",
      });
    }

    void loadBirthTime();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!ready || error || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [error, me, ready, router, store?.currentUserId]);

  async function downloadNatalPdf() {
    if (!me) return;
    setPreparingPdf(true);
    setDownloadError("");
    setDownloadNotice("");
    setShareError("");
    setShareNotice("");
    setWhatsappLink("");

    try {
      const pdf = await createProfileNatalPdf(me.chart, me.name);
      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: "carta-natal-astrared.pdf",
          data: await blobToBase64(pdf),
          directory: Directory.Documents,
          recursive: true,
        });
        setDownloadNotice("El PDF se guardó en Documentos.");
      } else {
        downloadPdf(pdf);
        setDownloadNotice("Tu carta natal en PDF se está descargando.");
      }
    } catch (cause) {
      setDownloadError(
        cause instanceof Error
          ? cause.message
          : "No se pudo descargar la carta natal en PDF.",
      );
    } finally {
      setPreparingPdf(false);
    }
  }

  async function shareNatalPdfOnWhatsApp() {
    if (!me) return;
    setPreparingPdf(true);
    setDownloadError("");
    setDownloadNotice("");
    setShareError("");
    setShareNotice("");
    setWhatsappLink("");

    try {
      const pdf = await createProfileNatalPdf(me.chart, me.name);
      const file = new File([pdf], "carta-natal-astrared.pdf", {
        type: "application/pdf",
      });
      const shareText = `Te comparto mi carta natal de AstraRed.`;

      if (Capacitor.isNativePlatform()) {
        const { value: canShare } = await Share.canShare();
        if (!canShare) {
          throw new Error("Este dispositivo no permite compartir archivos.");
        }
        const { uri } = await Filesystem.writeFile({
          path: "carta-natal-astrared.pdf",
          data: await blobToBase64(pdf),
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: "Mi carta natal de AstraRed",
          text: shareText,
          files: [uri],
          dialogTitle: "Compartir mi carta natal",
        });
        setShareNotice(
          "Elige WhatsApp en el menú para enviar el PDF completo de tu carta natal.",
        );
        return;
      }

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Mi carta natal de AstraRed",
            text: shareText,
          });
          setShareNotice("Elige WhatsApp para enviar el PDF completo de tu carta natal.");
          return;
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            setShareNotice("Se canceló el envío del PDF.");
            return;
          }
          throw cause;
        }
      }

      downloadPdf(pdf);

      const waUrl = `https://wa.me/?text=${encodeURIComponent(
        `${shareText} Adjuntaré el PDF descargado.`,
      )}`;
      const whatsappWindow = window.open(waUrl, "_blank");
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        setShareNotice(
          "El PDF se descargó. Adjunta el archivo en WhatsApp para enviarlo.",
        );
      } else {
        setWhatsappLink(waUrl);
        setShareNotice(
          "El PDF se descargó. Abre WhatsApp y adjunta el archivo para compartirlo.",
        );
      }
    } catch (cause) {
      setShareError(
        cause instanceof Error
          ? cause.message
          : "No se pudo preparar el PDF para compartir.",
      );
    } finally {
      setPreparingPdf(false);
    }
  }

  if (!ready || (!me && !error)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-amber-300">
        Consultando tu firmamento...
      </div>
    );
  }

  if (error || !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center">
        <p role="alert" className="max-w-xl text-sm leading-6 text-rose-300">
          {error || "No encontramos tu perfil. Completa el registro para crear tu carta."}
        </p>
      </main>
    );
  }

  const chart = me.chart;
  const readings = generatePlanetReadings(chart);
  const natalAspects = getNatalAspects(chart);
  const birthTimeForUser =
    birthTimeResult?.userId === me.id ? birthTimeResult : null;
  const birthTimeLoading = !birthTimeForUser;

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-[#080d1b] text-slate-100">
      <AppNav active="carta" />

      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:py-12">
        <article className="relative w-full min-w-0 overflow-hidden rounded-[2rem] bg-[#efe4c7] p-2 text-[#18243a] shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:p-3">
          <div className="pointer-events-none absolute inset-2 rounded-[1.55rem] border border-[#a88648]/70 sm:inset-3" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.35rem] border border-[#a88648]/25 sm:inset-5" />

          <span aria-hidden="true" className="pointer-events-none absolute left-6 top-5 font-serif text-3xl text-[#a88648]/80 sm:left-9 sm:top-8">✦</span>
          <span aria-hidden="true" className="pointer-events-none absolute right-6 top-5 font-serif text-3xl text-[#a88648]/80 sm:right-9 sm:top-8">✧</span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-5 left-6 font-serif text-3xl text-[#a88648]/80 sm:bottom-8 sm:left-9">✧</span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-5 right-6 font-serif text-3xl text-[#a88648]/80 sm:bottom-8 sm:right-9">✦</span>

          <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-12 sm:py-14">
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#92733b] sm:text-xs">
                ✦ &nbsp; Tu mapa celeste personal &nbsp; ✦
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#101a2b] sm:text-6xl">
                Carta natal
              </h1>
              <p className="mt-2 break-words font-serif text-2xl capitalize text-[#35435a] sm:text-3xl">
                {me.name}
              </p>
              <p className="mt-2 text-sm text-[#5d6470]">
                Hora de nacimiento:{" "}
                {birthTimeLoading
                  ? "consultando..."
                  : birthTimeForUser.unknown
                    ? "desconocida"
                    : birthTimeForUser.time
                      ? birthTimeForUser.time.slice(0, 5)
                      : "no disponible"}
              </p>
              {birthTimeForUser?.error && (
                <p role="alert" className="mt-2 text-xs text-red-800">
                  {birthTimeForUser.error}
                </p>
              )}
              <div className="mx-auto mt-5 flex max-w-xl flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void downloadNatalPdf()}
                  disabled={preparingPdf}
                  aria-busy={preparingPdf}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#a88648]/70 bg-[#18243a] px-5 py-3 text-sm font-semibold text-[#f2e5c6] shadow-lg transition hover:bg-[#243553] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18243a] disabled:cursor-wait disabled:opacity-60"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
                    <path d="M5 17v3h14v-3" />
                  </svg>
                  {preparingPdf ? "Preparando PDF..." : "Descargar carta natal (PDF)"}
                </button>
                <button
                  type="button"
                  onClick={() => void shareNatalPdfOnWhatsApp()}
                  disabled={preparingPdf}
                  aria-busy={preparingPdf}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-800/40 bg-[#16734b] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#12613f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16734b] disabled:cursor-wait disabled:opacity-60"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" />
                  </svg>
                  {preparingPdf ? "Preparando PDF..." : "Compartir por WhatsApp"}
                </button>
              </div>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#64676d]">
                El PDF incluye tu rueda, posiciones, casas, aspectos y
                convenciones; no muestra fecha, hora ni lugar de nacimiento.
                En WhatsApp, adjunta el PDF descargado si tu dispositivo no
                ofrece compartir archivos.
              </p>
              {downloadError && (
                <p role="alert" className="mt-2 text-xs text-red-800">
                  {downloadError}
                </p>
              )}
              {downloadNotice && (
                <p role="status" className="mt-2 text-xs text-[#65522e]">
                  {downloadNotice}
                </p>
              )}
              {shareError && (
                <p role="alert" className="mt-2 text-xs text-red-800">
                  {shareError}
                </p>
              )}
              {shareNotice && (
                <p role="status" className="mt-2 text-xs text-[#65522e]">
                  {shareNotice}
                </p>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-[#65522e] underline underline-offset-4"
                >
                  Abrir WhatsApp
                </a>
              )}
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.14em] text-[#5d6470] sm:text-sm">
                <span>{chart.triad.sun.sign} · {chart.triad.moon.sign} · {chart.triad.asc.sign}</span>
              </div>
              <div aria-hidden="true" className="mx-auto mt-6 flex max-w-xs items-center gap-3 text-[#a88648]">
                <span className="h-px flex-1 bg-[#a88648]/50" />
                <span className="text-lg">☼</span>
                <span className="h-px flex-1 bg-[#a88648]/50" />
              </div>
            </header>

            <section aria-label="Rueda de tu carta natal" className="mx-auto mt-8 max-w-2xl">
              <ChartWheel
                chart={chart}
                className="mx-auto w-full max-w-[560px] drop-shadow-[0_18px_32px_rgba(22,31,50,0.28)]"
              />
              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-[#897344]">
                Zodiaco tropical · {houseSystemLabel(chart.houseSystem)}
              </p>
            </section>

            <section className="mx-auto mt-9 max-w-3xl">
              <h2 className="text-center font-serif text-3xl font-semibold text-[#17233a] sm:text-4xl">
                Tu esencia astral
              </h2>
              <p className="mt-1 text-center text-xs uppercase tracking-[0.26em] text-[#947844]">
                Sol · Luna · Ascendente
              </p>
              <div className="mt-5">
                <Triad chart={chart} />
              </div>
              <p className="mx-auto mt-7 max-w-2xl whitespace-pre-line text-center font-serif text-lg leading-8 text-[#3f4753] sm:text-xl">
                {generateLifeSummary(chart)}
              </p>
              {chart.timeUnknown && (
                <p className="mx-auto mt-6 max-w-2xl border-t border-[#a88648]/30 pt-4 text-center text-xs leading-5 text-[#64676d]">
                  La hora de nacimiento no estaba disponible y se utilizó el
                  mediodía como referencia. La Luna, el Ascendente y las casas
                  pueden variar; interpreta estas posiciones con cautela.
                </p>
              )}
            </section>
          </div>
        </article>

        <section className="rounded-3xl border border-[#c9a964]/25 bg-[#10182a] p-5 shadow-xl sm:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d2b675]">Tu mapa en detalle</p>
              <h2 className="mt-2 font-serif text-3xl text-[#f2e5c6]">Planetas, signos y casas</h2>
            </div>
            <p className="text-sm text-slate-400">La posición de cada punto de tu carta.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#c9a964]/20">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[#18243a] text-xs uppercase tracking-wider text-[#d2b675]">
                <tr>
                  <th className="px-4 py-3">Punto</th>
                  <th className="px-4 py-3">Signo</th>
                  <th className="px-4 py-3">Grado</th>
                  <th className="px-4 py-3">Casa</th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((planet) => {
                  const position = roundedPosition(planet.longitude);
                  return (
                    <tr key={planet.id} className="border-t border-white/5 bg-[#0c1322]">
                      <th className="px-4 py-3 font-medium text-[#f2e5c6]">
                        {PLANET_META[planet.id].name}
                      </th>
                      <td className="px-4 py-3 text-slate-300">{position.sign}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDegree(position.degreeInSign)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{planet.house}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="natal-aspects-heading"
          className="rounded-3xl border border-[#c9a964]/25 bg-[#10182a] p-5 shadow-xl sm:p-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d2b675]">
              Lectura guiada
            </p>
            <h2
              id="natal-aspects-heading"
              className="mt-2 font-serif text-3xl text-[#f2e5c6]"
            >
              Aspectos más exactos
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Un aspecto describe una relación angular entre dos puntos de la
              carta. El orbe indica cuánto se aleja del ángulo exacto; aquí se
              muestran primero los más cerrados. Estas descripciones son una
              lectura astrológica simbólica, no una predicción.
            </p>
          </div>
          {natalAspects.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {natalAspects.slice(0, 6).map((aspect) => (
                <article
                  key={`${aspect.a}-${aspect.b}-${aspect.type}`}
                  className="rounded-2xl border border-[#c9a964]/20 bg-[#0c1322] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-[#f2e5c6]">
                      {PLANET_META[aspect.a].name} · {PLANET_META[aspect.b].name}
                    </h3>
                    <p className="text-sm text-[#e4c77f]">
                      {ASPECT_META[aspect.type].name} · orbe{" "}
                      {formatArcMinutes(aspect.orb)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {describeAspect(aspect.type)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-300">
              No se encontraron aspectos mayores dentro de los orbes definidos.
            </p>
          )}
        </section>

        <details className="group rounded-3xl border border-[#c9a964]/25 bg-[#10182a] shadow-xl">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2b675] sm:px-8 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-xs uppercase tracking-[0.25em] text-[#d2b675]">
                Transparencia
              </span>
              <span className="mt-1 block font-serif text-2xl text-[#f2e5c6]">
                Ver datos técnicos
              </span>
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 shrink-0 text-[#d2b675] transition-transform group-open:rotate-180 motion-reduce:transition-none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="space-y-8 border-t border-[#c9a964]/15 px-5 py-6 sm:px-8">
            <section aria-labelledby="calculation-method-heading">
              <h3
                id="calculation-method-heading"
                className="font-semibold text-[#e4c77f]"
              >
                Convenciones del cálculo
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300 marker:text-[#d2b675]">
                <li>
                  Zodiaco tropical; longitudes planetarias geocéntricas en la
                  eclíptica. Los planetas se calculan con Astronomy Engine y
                  corrección de aberración; la Luna usa su cálculo geocéntrico
                  específico.
                </li>
                <li>
                  Casas {houseSystemLabel(chart.houseSystem)}. El Nodo Norte es
                  medio y se calcula con una fórmula basada en el tiempo
                  terrestre.
                </li>
                <li>
                  Se incluyen conjunción, sextil, cuadratura, trígono y
                  oposición. Los orbes máximos de AstraRed son 8°, 6°, 7°, 8°
                  y 8°, respectivamente; otras cartas pueden usar límites
                  distintos.
                </li>
                <li>
                  Lilith y Quirón no se calculan todavía. El Medio Cielo no
                  aparece como punto planetario independiente; en Placidus
                  corresponde a la cúspide de la casa 10.
                </li>
                <li>
                  Las posiciones visibles se redondean al minuto de arco.
                  Diferencias de coordenadas, efemérides o redondeo pueden
                  cambiar el último minuto frente a otra plataforma.
                </li>
                {chart.timeUnknown && (
                  <li>
                    Como no se conoce la hora, los aspectos de la Luna y el
                    Ascendente se omiten; la Luna, el Ascendente y las casas se
                    calculan usando el mediodía como referencia y pueden variar.
                  </li>
                )}
              </ul>
            </section>

            <section aria-labelledby="house-cusps-heading">
              <h3
                id="house-cusps-heading"
                className="font-semibold text-[#e4c77f]"
              >
                Cúspides de las casas
              </h3>
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {chart.houses.map((longitude, index) => {
                  const cusp = roundedPosition(longitude);
                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#0c1322] px-4 py-3 text-sm"
                    >
                      <span className="text-slate-300">Casa {index + 1}</span>
                      <span className="text-[#f2e5c6]">
                        {cusp.sign} {formatDegree(cusp.degreeInSign)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="all-aspects-heading">
              <h3
                id="all-aspects-heading"
                className="font-semibold text-[#e4c77f]"
              >
                Aspectos mayores y orbes
              </h3>
              {natalAspects.length > 0 ? (
                <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/5">
                  {natalAspects.map((aspect) => (
                    <li
                      key={`${aspect.a}-${aspect.b}-${aspect.type}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-300">
                        {PLANET_META[aspect.a].name} · {PLANET_META[aspect.b].name}
                      </span>
                      <span className="text-[#f2e5c6]">
                        {ASPECT_META[aspect.type].name} ·{" "}
                        {formatArcMinutes(aspect.separation)} · orbe{" "}
                        {formatArcMinutes(aspect.orb)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-300">
                  No se encontraron aspectos mayores dentro de los orbes definidos.
                </p>
              )}
            </section>
          </div>
        </details>

        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d2b675]">Lectura astral</p>
            <h2 className="mt-2 font-serif text-3xl text-[#f2e5c6]">Los símbolos de tu cielo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Interpretaciones generadas desde las posiciones calculadas de tu carta.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {readings.map((reading) => (
              <article
                key={reading.planet}
                className="rounded-2xl border border-[#c9a964]/20 bg-[#10182a] p-5"
              >
                <h3 className="font-semibold text-[#e4c77f]">
                  {reading.title} · {reading.sign}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {reading.interpretation}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
