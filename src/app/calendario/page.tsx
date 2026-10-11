import { Suspense } from "react";
import { CalendarioUi } from "./ui";

export const metadata = {
  title: "Calendario Astral | Astra Red",
  description:
    "Explora las fases de la Luna, recibe sugerencias de la tradición astrológica y guarda tus fechas en tu agenda personal.",
};

export default function CalendarioPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
          Preparando tu calendario lunar...
        </div>
      }
    >
      <CalendarioUi />
    </Suspense>
  );
}
