import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { DailyHoroscopeExperience } from "./ui";

export const metadata: Metadata = publicPageMetadata({
  title: "Horóscopo de hoy para los 12 signos",
  description:
    "Consulta el horóscopo diario gratuito de AstraRed para tu signo: amor, trabajo, bienestar, energía y el clima astral local.",
  path: "/horoscopo",
});

export default function HoroscopePage() {
  return <DailyHoroscopeExperience />;
}
