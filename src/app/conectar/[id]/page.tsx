import { Suspense } from "react";
import { ConectarUi } from "./ui";

export const instant = false;

export default function ConectarPage() {
  return (
    <Suspense
      fallback={
        <div className="grid flex-1 place-items-center text-muted">Tejiendo aspectos…</div>
      }
    >
      <ConectarUi />
    </Suspense>
  );
}
