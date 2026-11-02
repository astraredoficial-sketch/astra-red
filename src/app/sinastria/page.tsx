import type { Metadata } from "next";
import { SinastriaUi } from "./ui";

export const metadata: Metadata = {
  title: "Sinastría | AstraRed",
  description:
    "Compara dos cartas natales y explora sus aspectos astrológicos con AstraRed.",
};

export default function SinastriaPage() {
  return <SinastriaUi />;
}