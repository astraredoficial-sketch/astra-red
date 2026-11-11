import { SIGNS } from "./constants";
import type { DailyHoroscopeReading } from "./dailyHoroscope";

const SIGN_SLUGS = [
  "aries",
  "tauro",
  "geminis",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "escorpio",
  "sagitario",
  "capricornio",
  "acuario",
  "piscis",
] as const;

export function getHoroscopeSignSlug(sign: string): string {
  const signIndex = SIGNS.findIndex((candidate) => candidate === sign);
  if (signIndex < 0) {
    throw new RangeError("El signo seleccionado no es válido.");
  }
  return SIGN_SLUGS[signIndex];
}

export function getHoroscopeSignFromSlug(slug: string): number | null {
  const normalized = slug.trim().toLocaleLowerCase("es");
  const signIndex = SIGN_SLUGS.findIndex((candidate) => candidate === normalized);
  return signIndex < 0 ? null : signIndex;
}

export function buildHoroscopeShareUrl(sign: string): string {
  const url = new URL("https://astrared.vip/horoscopo");
  url.searchParams.set("sign", getHoroscopeSignSlug(sign));
  return url.toString();
}

export function buildHoroscopeShareText(
  reading: DailyHoroscopeReading,
  date: string,
): string {
  return [
    `Mi horóscopo de hoy · ${reading.sign} · ${date}`,
    reading.overview,
    `Amor: ${reading.love}`,
    `Trabajo: ${reading.work}`,
    `Bienestar: ${reading.wellbeing}`,
    `Intención: ${reading.affirmation}`,
    `Número simbólico: ${reading.luckyNumber} · Color: ${reading.luckyColor}`,
    "Una lectura simbólica de AstraRed:",
    buildHoroscopeShareUrl(reading.sign),
  ].join("\n\n");
}
