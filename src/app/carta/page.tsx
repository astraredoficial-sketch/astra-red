import { Suspense } from "react";
import { CartaUi } from "./ui";

export const instant = false;

export default function CartaPage() {
  return (
    <Suspense fallback={<div className="grid flex-1 place-items-center text-muted">Leyendo tu cielo…</div>}>
      <CartaUi />
    </Suspense>
  );
}
