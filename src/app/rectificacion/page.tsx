import type { Metadata } from "next";
import { RectificationUi } from "./ui";

export const metadata: Metadata = {
  title: "Rectificación natal | AstraRed",
  description:
    "Compara horas natales candidatas con acontecimientos biográficos fechados.",
};

export default function RectificationPage() {
  return <RectificationUi />;
}
