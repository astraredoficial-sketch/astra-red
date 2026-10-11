import { Suspense } from "react";
import { DestinosUi } from "./ui";

export const instant = false;

export default function DestinosPage() {
  return (
    <Suspense fallback={<div className="grid flex-1 place-items-center text-muted">Alineando destinos…</div>}>
      <DestinosUi />
    </Suspense>
  );
}

