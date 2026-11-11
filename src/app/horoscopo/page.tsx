import type { Metadata } from "next";
import { DailyHoroscopeExperience } from "./ui";

export const metadata: Metadata = {
  title: "Horóscopo de hoy | AstraRed",
  robots: { index: false, follow: false },
};

export default function HoroscopePage() {
  return <DailyHoroscopeExperience />;
}
