import type { Metadata } from "next";
import { SinastriaUi } from "./ui";

export const metadata: Metadata = {
  title: "Sinastria | AstraRed",
  description:
    "Compara dos cartas natales y explora sus aspectos astrologicos con AstraRed.",
};

export default function SinastriaPage() {
  return <SinastriaUi />;
}