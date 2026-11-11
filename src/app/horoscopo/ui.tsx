"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { SIGN_GLYPHS, SIGNS } from "@/lib/astro/constants";
import {
  calculateDailyHoroscope,
  getLocalCalendarDate,
  ZODIAC_ELEMENTS,
  type DailyHoroscope,
  type DailyHoroscopeReading,
} from "@/lib/astro/dailyHoroscope";
import {
  buildHoroscopeShareText,
  getHoroscopeSignFromSlug,
  getHoroscopeSignSlug,
} from "@/lib/astro/horoscopeShare";

function subscribeToLocationChanges(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("astrared:locationchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("astrared:locationchange", callback);
  };
}

function getSelectedSignFromLocation(): number | null {
  const slug = new URLSearchParams(window.location.search).get("sign");
  return slug ? getHoroscopeSignFromSlug(slug) : null;
}

function getServerSelectedSign(): null {
  return null;
}

function ZodiacSeal({
  index,
  selected = false,
}: {
  index: number;
  selected?: boolean;
}) {
  return (
    <span
      className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
        selected
          ? "border-amber-200/70 bg-amber-100/10 text-amber-100"
          : "border-white/15 bg-white/[0.03] text-[#d9c8ee]"
      }`}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 48 48"
        fill="none"
      >
        <circle cx="24" cy="24" r="20.5" stroke="currentColor" strokeOpacity=".24" />
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeOpacity=".14" strokeDasharray="1 4" />
        <path d="M24 2v4M24 42v4M2 24h4M42 24h4" stroke="currentColor" strokeOpacity=".48" />
      </svg>
      <span className="relative font-serif text-2xl leading-none">
        {SIGN_GLYPHS[index]}
      </span>
    </span>
  );
}

function HoroscopeCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: "heart" | "work" | "moon" | "spark";
  children: string;
}) {
  const paths = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  };
  return (
    <article className="rounded-2xl border border-white/10 bg-[#100e19]/90 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-100/15 bg-amber-100/[0.04] text-amber-100">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {paths[icon]}
          </svg>
        </span>
        <h3 className="font-serif text-xl text-white">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#d4cddd]">{children}</p>
    </article>
  );
}

function formatLocalDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const localNoon = new Date(0);
  localNoon.setUTCFullYear(year, month - 1, day);
  localNoon.setUTCHours(12, 0, 0, 0);
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(localNoon);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  alignment: CanvasTextAlign = "left",
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let lastLine = visibleLines[maxLines - 1];
    while (
      lastLine.length > 0 &&
      context.measureText(`${lastLine}…`).width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[maxLines - 1] = `${lastLine.trimEnd()}…`;
  }
  const previousAlignment = context.textAlign;
  context.textAlign = alignment;
  visibleLines.forEach((value, index) => {
    context.fillText(value, x, y + index * lineHeight, maxWidth);
  });
  context.textAlign = previousAlignment;
  return visibleLines.length;
}

function roundedCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

async function createHoroscopeShareImage(
  reading: DailyHoroscopeReading,
  horoscope: DailyHoroscope,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la tarjeta para compartir.");
  }

  const { width, height } = canvas;
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#181321");
  background.addColorStop(0.52, "#0b0a12");
  background.addColorStop(1, "#111421");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(850, 150, 12, 850, 150, 640);
  glow.addColorStop(0, "rgba(151, 105, 173, 0.26)");
  glow.addColorStop(1, "rgba(151, 105, 173, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "rgba(229, 200, 145, .68)";
  context.lineWidth = 2;
  roundedCard(context, 28, 28, width - 56, height - 56, 38);
  context.stroke();
  context.strokeStyle = "rgba(229, 200, 145, .2)";
  context.lineWidth = 1;
  roundedCard(context, 44, 44, width - 88, height - 88, 30);
  context.stroke();
  context.restore();

  const stars = [
    [107, 134, 2], [924, 102, 3], [978, 270, 2], [133, 394, 2],
    [931, 455, 2], [64, 783, 2], [1001, 847, 3], [914, 1060, 2],
    [117, 1196, 3], [964, 1294, 2], [206, 1354, 2], [853, 1370, 2],
  ];
  stars.forEach(([x, y, radius], index) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = index % 3 === 0 ? "#e5c891" : "#cdb7dc";
    context.globalAlpha = index % 2 === 0 ? 0.75 : 0.45;
    context.fill();
  });
  context.globalAlpha = 1;

  context.textAlign = "center";
  context.fillStyle = "#e7ca91";
  context.font = "600 24px Arial, sans-serif";
  context.letterSpacing = "7px";
  context.fillText("ASTRARED  ·  CIELO DE HOY", width / 2, 102);
  context.letterSpacing = "0px";

  const sealX = width / 2;
  const sealY = 236;
  context.beginPath();
  context.arc(sealX, sealY, 88, 0, Math.PI * 2);
  context.fillStyle = "rgba(231, 202, 145, .055)";
  context.fill();
  context.strokeStyle = "rgba(231, 202, 145, .75)";
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.arc(sealX, sealY, 72, 0, Math.PI * 2);
  context.setLineDash([2, 8]);
  context.strokeStyle = "rgba(231, 202, 145, .42)";
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "#f4e4c2";
  context.font = "112px Georgia, serif";
  context.fillText(reading.glyph, sealX, sealY + 38);

  context.fillStyle = "#fffaf1";
  context.font = "56px Georgia, serif";
  context.fillText(reading.sign, width / 2, 372);
  context.fillStyle = "#d8c0e5";
  context.font = "600 20px Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText(`${reading.element.toUpperCase()}  ·  HORÓSCOPO DIARIO`, width / 2, 414);
  context.letterSpacing = "0px";
  context.fillStyle = "#c8bfd1";
  context.font = "22px Arial, sans-serif";
  context.fillText(formatLocalDate(horoscope.date), width / 2, 458);
  context.fillStyle = "#e5c891";
  context.font = "18px Arial, sans-serif";
  context.fillText(
    `Sol en ${horoscope.sky.sunSign}  ·  Luna en ${horoscope.sky.moonSign}  ·  ${horoscope.sky.lunarPhase}`,
    width / 2,
    496,
  );

  context.fillStyle = "#eee6f0";
  context.font = "24px Georgia, serif";
  drawWrappedText(context, reading.overview, 110, 552, 860, 35, 3);

  const cards = [
    { title: "AMOR Y VÍNCULOS", text: reading.love },
    { title: "TRABAJO Y PROYECTOS", text: reading.work },
    { title: "BIENESTAR Y RITMO", text: reading.wellbeing },
    { title: "TU MOVIMIENTO DE HOY", text: reading.action },
  ];
  const cardPositions = [
    [72, 640], [552, 640], [72, 866], [552, 866],
  ] as const;
  cards.forEach((card, index) => {
    const [x, y] = cardPositions[index];
    context.fillStyle = "rgba(255,255,255,.035)";
    roundedCard(context, x, y, 456, 216, 22);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.14)";
    context.lineWidth = 1;
    context.stroke();
    context.textAlign = "left";
    context.fillStyle = "#e7ca91";
    context.font = "600 17px Arial, sans-serif";
    context.letterSpacing = "1px";
    context.fillText(card.title, x + 24, y + 42);
    context.letterSpacing = "0px";
    context.fillStyle = "#e3dce8";
    context.font = "19px Arial, sans-serif";
    drawWrappedText(context, card.text, x + 24, y + 78, 408, 27, 5);
  });

  const detailY = 1102;
  const detailCards = [
    { x: 72, title: "NÚMERO SIMBÓLICO", value: String(reading.luckyNumber) },
    { x: 552, title: "COLOR DE INSPIRACIÓN", value: reading.luckyColor },
  ];
  detailCards.forEach((card) => {
    context.fillStyle = "rgba(231,202,145,.055)";
    roundedCard(context, card.x, detailY, 456, 102, 20);
    context.fill();
    context.strokeStyle = "rgba(231,202,145,.3)";
    context.stroke();
    context.textAlign = "left";
    context.fillStyle = "#c8bfd1";
    context.font = "600 15px Arial, sans-serif";
    context.letterSpacing = "1px";
    context.fillText(card.title, card.x + 22, detailY + 33);
    context.letterSpacing = "0px";
    context.fillStyle = "#f4e4c2";
    context.font = "28px Georgia, serif";
    context.fillText(card.value, card.x + 22, detailY + 73);
  });

  context.textAlign = "center";
  context.fillStyle = "#e7ca91";
  context.font = "600 16px Arial, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("INTENCIÓN PARA HOY", width / 2, 1268);
  context.letterSpacing = "0px";
  context.fillStyle = "#fffaf1";
  context.font = "italic 25px Georgia, serif";
  drawWrappedText(
    context,
    `“${reading.affirmation}”`,
    width / 2,
    1312,
    844,
    34,
    2,
    "center",
  );

  context.fillStyle = "#c8bfd1";
  context.font = "17px Arial, sans-serif";
  context.fillText("Una lectura simbólica para reflexionar · astrared.vip", width / 2, 1380);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("No se pudo generar la imagen del horóscopo."));
    }, "image/png");
  });
  return new File(
    [blob],
    `astrared-horoscopo-${getHoroscopeSignSlug(reading.sign)}-${horoscope.date}.png`,
    { type: "image/png" },
  );
}

export function DailyHoroscopeExperience() {
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const selectedSign = useSyncExternalStore(
    subscribeToLocationChanges,
    getSelectedSignFromLocation,
    getServerSelectedSign,
  );
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState("");

  useEffect(() => {
    if (!ready || sessionError || me) return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.replace(
      store?.currentUserId
        ? "/onboarding"
        : `/acceso?mode=login&next=${encodeURIComponent(returnTo)}`,
    );
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!me) return;
    let active = true;
    let currentKey = "";
    const updateIfLocalDayChanged = () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        const date = getLocalCalendarDate(new Date(), timeZone);
        const key = `${date}|${timeZone}`;
        if (key === currentKey) return;
        const result = calculateDailyHoroscope(date, timeZone);
        if (!active) return;
        currentKey = key;
        setHoroscope(result);
        setError("");
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo calcular el horóscopo de hoy.",
        );
      }
    };

    updateIfLocalDayChanged();
    const intervalId = window.setInterval(updateIfLocalDayChanged, 60_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [me]);

  const reading: DailyHoroscopeReading | null =
    selectedSign === null ? null : horoscope?.readings[selectedSign] ?? null;

  function selectSign(index: number) {
    setShareStatus("");
    setWhatsappFallbackUrl("");
    const sign = SIGNS[index];
    const url = new URL(window.location.href);
    url.searchParams.set("sign", getHoroscopeSignSlug(sign));
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event("astrared:locationchange"));
  }

  async function shareReading() {
    if (!me || !reading || !horoscope || sharing) return;
    setSharing(true);
    setShareStatus("");
    setWhatsappFallbackUrl("");
    try {
      const file = await createHoroscopeShareImage(reading, horoscope);
      const text = buildHoroscopeShareText(reading, horoscope.date);
      const shareData = {
        files: [file],
        title: `Horóscopo de ${reading.sign} · AstraRed`,
        text,
      };

      if (
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        try {
          await navigator.share(shareData);
          setShareStatus("Tarjeta lista para compartir desde tu dispositivo.");
          return;
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            return;
          }
        }
      }

      const objectUrl = URL.createObjectURL(file);
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = file.name;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setWhatsappFallbackUrl(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
      );
      setShareStatus(
        "La tarjeta se descargó. Adjunta la imagen en WhatsApp y comparte el enlace.",
      );
    } catch (cause) {
      setShareStatus(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear la tarjeta para compartir.",
      );
    } finally {
      setSharing(false);
    }
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080711] px-6 text-center text-[#e8dff0]">
        <p>Verificando tu sesión para abrir el horóscopo…</p>
      </main>
    );
  }

  if (sessionError || !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080711] px-6 text-center">
        <div className="max-w-lg">
          <p role="alert" className="text-sm leading-6 text-rose-200">
            {sessionError || "Inicia sesión para consultar tu horóscopo."}
          </p>
          <Link
            href="/acceso?mode=login"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-amber-100/35 px-5 py-2 text-sm font-semibold text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="starfield min-h-screen bg-[#07060c] text-ink">
      <AppNav />
      <main className="min-h-[calc(100vh-5rem)] px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/carta"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-[#d8cde0] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6M9 12h12" />
            </svg>
            Mis herramientas
          </Link>
          <Link
            href="/guias"
            className="inline-flex min-h-11 items-center text-sm text-[#d8cde0] underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100"
          >
            Guías de AstraRed
          </Link>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-amber-100/15 bg-[radial-gradient(ellipse_at_50%_0%,rgba(135,91,157,0.22),transparent_58%),linear-gradient(145deg,#15111e,#0b0a12_72%)] px-5 py-10 sm:mt-12 sm:px-10 sm:py-14">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 text-amber-100/15 sm:right-6 sm:top-2 sm:h-64 sm:w-64"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="65" stroke="currentColor" />
            <circle cx="100" cy="100" r="82" stroke="currentColor" strokeDasharray="1 7" />
            <circle cx="100" cy="100" r="46" stroke="currentColor" strokeOpacity=".65" />
            <path d="M100 9v14m0 154v14M9 100h14m154 0h14M35.6 35.6l10 10m108.8 108.8 10 10m0-128.8-10 10M45.6 154.4l-10 10" stroke="currentColor" />
            <circle cx="100" cy="100" r="5" fill="currentColor" />
          </svg>
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-100/80">
              AstraRed · Cielo de hoy
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.025em] text-white sm:text-6xl">
              Horóscopo de hoy
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d6ccdf] sm:text-base sm:leading-8">
              Una lectura para tu signo solar, creada con nuestro motor
              astronómico y las posiciones del cielo para el mediodía de tu
              fecha local. Explora el amor, el trabajo y tu ritmo personal como
              una invitación a reflexionar, no como una predicción.
            </p>
          </div>

          <div
            className="relative mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm text-[#ded4e5]"
            aria-live="polite"
          >
            {horoscope ? (
              <>
                <p className="font-medium text-white">
                  {formatLocalDate(horoscope.date)}
                </p>
                <span className="hidden h-1 w-1 rounded-full bg-amber-100/60 sm:block" />
                <p>
                  Sol en {horoscope.sky.sunSign} · Luna en{" "}
                  {horoscope.sky.moonSign}
                </p>
                <span className="hidden h-1 w-1 rounded-full bg-amber-100/60 sm:block" />
                <p>{horoscope.sky.lunarPhase}</p>
              </>
            ) : error ? (
              <p role="alert" className="text-rose-200">{error}</p>
            ) : (
              <p>Calculando el cielo para tu fecha y zona horaria local…</p>
            )}
          </div>
        </section>

        <section aria-labelledby="sign-picker-title" className="mt-10 sm:mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a9d8]">
                Tu signo solar
              </p>
              <h2
                id="sign-picker-title"
                className="mt-2 font-serif text-2xl text-white sm:text-3xl"
              >
                Elige tu constelación
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">
              Selecciona tu signo solar para abrir la lectura completa de hoy.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {SIGNS.map((sign, index) => {
              const isSelected = selectedSign === index;
              return (
                <button
                  key={sign}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectSign(index)}
                  className={`group flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100 sm:min-h-[4.5rem] sm:px-4 ${
                    isSelected
                      ? "border-amber-100/60 bg-amber-100/[0.08] shadow-[0_0_30px_rgba(212,178,116,0.08)]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]"
                  }`}
                >
                  <ZodiacSeal index={index} selected={isSelected} />
                  <span className="min-w-0">
                    <span className="block font-serif text-base text-white sm:text-lg">
                      {sign}
                    </span>
                    <span className="block text-xs text-muted">
                      {ZODIAC_ELEMENTS[index]}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    className={`ml-auto h-4 w-4 shrink-0 transition-colors ${
                      isSelected ? "text-amber-100" : "text-white/25 group-hover:text-white/60"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        </section>

        {reading && horoscope ? (
          <section
            aria-labelledby="daily-reading-title"
            className="mt-10 scroll-mt-6 sm:mt-14"
          >
            <header className="relative overflow-hidden rounded-[2rem] border border-amber-100/20 bg-[radial-gradient(ellipse_at_100%_0%,rgba(165,119,178,0.19),transparent_45%),linear-gradient(145deg,#171220,#0c0b13)] p-5 sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-4">
                <ZodiacSeal index={reading.signIndex} selected />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75">
                    {reading.element} · Lectura del día
                  </p>
                  <h2
                    id="daily-reading-title"
                    className="mt-1 font-serif text-3xl text-white sm:text-4xl"
                  >
                    {reading.sign}
                  </h2>
                </div>
              </div>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#e2d9e8] sm:text-lg sm:leading-8">
                {reading.overview}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted">
                Lectura calculada para el {formatLocalDate(horoscope.date)}{" "}
                · zona {horoscope.timeZone}
              </p>
            </header>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <HoroscopeCard title="Amor y vínculos" icon="heart">
                {reading.love}
              </HoroscopeCard>
              <HoroscopeCard title="Trabajo y proyectos" icon="work">
                {reading.work}
              </HoroscopeCard>
              <HoroscopeCard title="Bienestar y ritmo" icon="moon">
                {reading.wellbeing}
              </HoroscopeCard>
              <HoroscopeCard title="Tu movimiento de hoy" icon="spark">
                {reading.action}
              </HoroscopeCard>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Número simbólico
                </p>
                <p className="mt-2 font-serif text-3xl text-amber-100">
                  {reading.luckyNumber}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Una clave lúdica para acompañar tu intención.
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Color de inspiración
                </p>
                <p className="mt-2 font-serif text-xl text-white">
                  {reading.luckyColor}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Una sugerencia creativa, no una garantía de suerte.
                </p>
              </article>
              <article className="rounded-2xl border border-amber-100/15 bg-amber-100/[0.035] p-5 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/75">
                  Intención
                </p>
                <p className="mt-2 font-serif text-lg leading-6 text-white">
                  “{reading.affirmation}”
                </p>
              </article>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-950/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-serif text-lg text-white">
                  Comparte tu cielo de hoy
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#cfc9d3]">
                  Crea una tarjeta con la lectura completa de {reading.sign}.
                </p>
              </div>
              <button
                type="button"
                onClick={shareReading}
                disabled={sharing}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#128c4a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16a05a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emerald-200 disabled:cursor-wait disabled:opacity-70"
              >
                {sharing ? (
                  <>
                    <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".35" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Preparando tarjeta…
                  </>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.3L3 20l1.2-4.9a8.4 8.4 0 1 1 16.3-3.5Z" />
                      <path d="M8.6 8.3c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4 0 .6.4.7 1.1 1.4 1.8 1.8.2.1.4.1.6-.1l.7-.7c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .3-.1.9-.6 1.3-.5.5-1.3.7-2 .5-1.1-.3-2.5-.9-3.8-2.2-1.1-1.1-1.8-2.5-2-3.5-.2-.8.1-1.4.7-1.7Z" />
                    </svg>
                    Compartir por WhatsApp
                  </>
                )}
              </button>
            </div>
            {shareStatus && (
              <p
                role="status"
                className="mt-3 text-sm leading-6 text-[#d8cde0]"
              >
                {shareStatus}
                {whatsappFallbackUrl && (
                  <>
                    {" "}
                    <a
                      href={whatsappFallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                    >
                      Abrir WhatsApp
                    </a>
                  </>
                )}
              </p>
            )}

            <p className="mt-5 text-xs leading-5 text-muted">
              El cielo se calcula localmente con Astronomy Engine para el
              mediodía de tu día calendario. Las interpretaciones se construyen
              con reglas editoriales de AstraRed a partir de tránsitos por
              signo; no requieren una API externa ni usan tus datos de
              nacimiento. La astrología se ofrece como reflexión simbólica, no
              como predicción ni consejo profesional.
            </p>
          </section>
        ) : (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-6 text-center sm:mt-12">
            <p className="font-serif text-xl text-white">
              Tu lectura comienza con tu signo
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Elige uno de los doce signos para descubrir el clima de hoy en
              tus vínculos, proyectos y bienestar.
            </p>
          </section>
        )}
      </div>
      </main>
    </div>
  );
}
