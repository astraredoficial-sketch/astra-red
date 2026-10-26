import type { Metadata } from "next";
import { CicloPersonalUi } from "./ui";

export const metadata: Metadata = {
  title: "Ciclo personal | AstraRed",
  description:
    "Consulta tu próximo retorno lunar y cuánto falta para que la Luna vuelva a la posición de tu carta natal.",
};

export default function CicloPersonalPage() {
  return <CicloPersonalUi />;
}